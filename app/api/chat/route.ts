import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { generateEmbedding } from '@/lib/embeddings'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get the query from the request body
    const { query } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'No query provided' }, { status: 400 })
    }

    // 3. Generate embedding for the user's query
    const queryEmbedding = await generateEmbedding(query)

    // 4. Perform similarity search in Supabase
    const adminClient = createAdminClient()
    const { data: chunks, error: searchError } = await adminClient.rpc(
      'match_document_chunks',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5,
        p_user_id: user.id,
      }
    )

    if (searchError) {
      console.error('Search error:', searchError)
      return NextResponse.json({ error: 'Search failed.' }, { status: 500 })
    }

    // 5. Build context from retrieved chunks
    const context = (chunks || [])
      .map((chunk: { content: string; similarity: number }) => chunk.content)
      .join('\n\n---\n\n')

    // 6. Call Google Gemini LLM with context + query
    const systemPrompt = `You are a helpful personal AI assistant. Answer the user's question based ONLY on the provided context. 

Format your response to be highly readable and user-friendly:
- Use relevant emojis at the start of major sections or categories.
- Use clear, bold headings for different topics (e.g., ### Topic Name).
- Use bullet points for lists and indentation for sub-items.
- Keep sentences concise and use professional but friendly language.
- If the context doesn't have the answer, say so clearly.

Reference the uploaded documents when appropriate.`

    const userPrompt = context
      ? `Context from user's documents:\n\n${context}\n\n---\n\nUser's Question: ${query}`
      : `The user has not uploaded any relevant documents for this question.\n\nUser's Question: ${query}`

    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

    const result = await model.generateContentStream({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
      ]
    })

    // 7. Stream the response back
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText))
            }
          }
        } catch (e) {
          console.error('Gemini stream error:', e)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (e: unknown) {
    console.error('Chat error:', e)
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

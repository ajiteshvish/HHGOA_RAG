import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { generateEmbedding } from '@/lib/embeddings'
import { chunkText } from '@/lib/chunker'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  switch (fileType) {
    case 'application/pdf': {
      // Import the worker module first to polyfill browser APIs like DOMMatrix in Node.js
      const { CanvasFactory } = await import('pdf-parse/worker')
      const { PDFParse } = await import('pdf-parse')
      
      const parser = new PDFParse({ 
        data: buffer,
        disableWorker: true,
        verbosity: 0,
        CanvasFactory
      } as any)
      
      const result = await parser.getText()
      const text = result.text
      
      // Clean up to release memory
      if (typeof parser.destroy === 'function') {
        await parser.destroy()
      }

      return text
    }
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const mammothModule = await import('mammoth')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mammoth = (mammothModule as any).default || mammothModule
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }
    case 'text/plain': {
      return buffer.toString('utf-8')
    }
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get the file from the request
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileType = file.type
    const fileName = file.name

    // 3. Extract text
    let text: string
    try {
      text = await extractText(buffer, fileType)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      return NextResponse.json({ error: `Text extraction failed: ${message}` }, { status: 400 })
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract any text from the file.' }, { status: 400 })
    }

    // 4. Use admin client to bypass RLS for inserting chunks
    const adminClient = createAdminClient()

    // 5. Insert document metadata
    const documentId = uuidv4()
    const { error: docError } = await adminClient
      .from('documents')
      .insert({
        id: documentId,
        user_id: user.id,
        name: fileName,
        type: fileType,
        size: buffer.length,
      })

    if (docError) {
      console.error('Document insert error:', docError)
      return NextResponse.json({ error: 'Failed to save document metadata.' }, { status: 500 })
    }

    // 6. Chunk the text
    const chunks = chunkText(text)

    // 7. Generate embeddings and store chunks
    const chunkRecords = []
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i])
      chunkRecords.push({
        document_id: documentId,
        chunk_index: i,
        content: chunks[i],
        embedding: embedding,
      })
    }

    // Insert all chunks
    const { error: chunkError } = await adminClient
      .from('document_chunks')
      .insert(chunkRecords)

    if (chunkError) {
      console.error('Chunk insert error:', chunkError)
      // Cleanup the document record if chunks failed
      await adminClient.from('documents').delete().eq('id', documentId)
      return NextResponse.json({ error: 'Failed to process document chunks.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        name: fileName,
        chunks: chunks.length,
      },
    })
  } catch (e: unknown) {
    console.error('Upload error:', e)
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

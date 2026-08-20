import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { insertDocument, insertDocumentChunks } from '@/lib/db'
import { generateEmbedding } from '@/lib/embeddings'
import { chunkDocument, ChunkingStrategy } from '@/lib/chunker'
import { v4 as uuidv4 } from 'uuid'

async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  switch (fileType) {
    case 'application/pdf': {
      const { CanvasFactory } = await import('pdf-parse/worker')
      const { PDFParse } = await import('pdf-parse')
      
      const parser = new PDFParse({ 
        data: buffer,
        disableWorker: true,
        verbosity: 0,
        CanvasFactory
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      
      const result = await parser.getText()
      const text = result.text
      
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
    case 'text/markdown':
    case 'text/plain': {
      return buffer.toString('utf-8')
    }
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user from session
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Extract file and optional chunking strategy
    const formData = await request.formData()
    const file = formData.get('file') as File
    const strategy = (formData.get('strategy') as ChunkingStrategy) || 'auto'

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

    // 4. Save document metadata to Neon DB
    const documentId = uuidv4()
    await insertDocument({
      id: documentId,
      userId: user.id,
      name: fileName,
      type: fileType,
      size: buffer.length
    })

    // 5. Multi-Strategy Chunking
    const chunks = await chunkDocument(text, {
      strategy,
      embeddingFn: generateEmbedding
    })

    // 6. Generate embeddings and store chunk records into Neon DB
    const chunkRecords = []
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i].content)
      chunkRecords.push({
        documentId: documentId,
        chunkIndex: i,
        content: chunks[i].content,
        embedding: embedding,
      })
    }

    // Batch insert into Neon DB
    await insertDocumentChunks(chunkRecords)

    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        name: fileName,
        chunks: chunks.length,
        strategy: chunks[0]?.strategy || strategy
      },
    })
  } catch (e: unknown) {
    console.error('Neon upload error:', e)
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

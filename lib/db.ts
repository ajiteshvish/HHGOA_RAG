import { neon, NeonQueryFunction } from '@neondatabase/serverless'

// Cache neon sql client
let sqlClient: NeonQueryFunction<false, false> | null = null

export function getDb() {
  if (!sqlClient) {
    const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured in .env.local')
    }
    sqlClient = neon(databaseUrl)
  }
  return sqlClient
}

export interface DocumentRow {
  id: string
  user_id: string
  name: string
  type: string
  size: number | null
  created_at: string
}

export interface DocumentChunkRow {
  id: string
  document_id: string
  chunk_index: number
  content: string
  similarity?: number
}

/**
 * Fetch all documents for a given user from Neon DB.
 */
export async function getDocumentsForUser(userId: string): Promise<DocumentRow[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, user_id, name, type, size, created_at
    FROM documents
    WHERE user_id = ${userId}
    ORDER BY created_at DESC;
  `
  return rows as unknown as DocumentRow[]
}

/**
 * Insert document metadata into Neon DB.
 */
export async function insertDocument(doc: {
  id: string
  userId: string
  name: string
  type: string
  size: number
}): Promise<void> {
  const sql = getDb()
  await sql`
    INSERT INTO documents (id, user_id, name, type, size)
    VALUES (${doc.id}, ${doc.userId}, ${doc.name}, ${doc.type}, ${doc.size});
  `
}

/**
 * Insert multiple document chunks into Neon DB.
 */
export async function insertDocumentChunks(
  chunks: Array<{
    documentId: string
    chunkIndex: number
    content: string
    embedding: number[]
  }>
): Promise<void> {
  const sql = getDb()
  for (const chunk of chunks) {
    const embeddingStr = `[${chunk.embedding.join(',')}]`
    await sql`
      INSERT INTO document_chunks (document_id, chunk_index, content, embedding)
      VALUES (${chunk.documentId}, ${chunk.chunkIndex}, ${chunk.content}, ${embeddingStr}::vector);
    `
  }
}

/**
 * Perform pgvector vector similarity search on Neon DB.
 */
export async function searchSimilarChunks(params: {
  userId: string
  queryEmbedding: number[]
  matchThreshold?: number
  matchCount?: number
}): Promise<Array<{ id: string; document_id: string; content: string; similarity: number }>> {
  const { userId, queryEmbedding, matchThreshold = 0.35, matchCount = 5 } = params
  const sql = getDb()
  const embeddingStr = `[${queryEmbedding.join(',')}]`

  const rows = await sql`
    SELECT 
      c.id,
      c.document_id,
      c.content,
      1 - (c.embedding <=> ${embeddingStr}::vector) AS similarity
    FROM document_chunks c
    JOIN documents d ON d.id = c.document_id
    WHERE d.user_id = ${userId}
      AND (1 - (c.embedding <=> ${embeddingStr}::vector)) > ${matchThreshold}
    ORDER BY c.embedding <=> ${embeddingStr}::vector ASC
    LIMIT ${matchCount};
  `

  return rows as unknown as Array<{
    id: string
    document_id: string
    content: string
    similarity: number
  }>
}

/**
 * Delete document and cascade delete its chunks from Neon DB.
 */
export async function deleteDocumentById(documentId: string, userId: string): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    DELETE FROM documents
    WHERE id = ${documentId} AND user_id = ${userId}
    RETURNING id;
  `
  return rows.length > 0
}

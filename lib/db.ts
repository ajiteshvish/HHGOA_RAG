import { neon, NeonQueryFunction } from '@neondatabase/serverless'

/**
 * Neon Serverless Database Client
 */
export function getDb(): NeonQueryFunction<false, false> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined.')
  }
  return neon(connectionString)
}

/**
 * Insert a document metadata record into Neon DB.
 */
export async function createDocumentRecord(params: {
  id?: string
  userId: string
  name: string
  type?: string
  size?: number
}): Promise<{ id: string; user_id: string; name: string; type: string; size: number; created_at: string }> {
  const sql = getDb()
  const docId = params.id || undefined
  const docType = params.type || 'text/plain'
  const docSize = params.size || 0

  if (docId) {
    const rows = await sql`
      INSERT INTO documents (id, user_id, name, type, size)
      VALUES (${docId}, ${params.userId}, ${params.name}, ${docType}, ${docSize})
      RETURNING id, user_id, name, type, size, created_at;
    `
    return rows[0] as unknown as { id: string; user_id: string; name: string; type: string; size: number; created_at: string }
  }

  const rows = await sql`
    INSERT INTO documents (user_id, name, type, size)
    VALUES (${params.userId}, ${params.name}, ${docType}, ${docSize})
    RETURNING id, user_id, name, type, size, created_at;
  `
  return rows[0] as unknown as { id: string; user_id: string; name: string; type: string; size: number; created_at: string }
}

export const insertDocument = createDocumentRecord

/**
 * Insert document chunks with 768-dim embeddings into Neon DB.
 */
export async function insertDocumentChunks(
  chunks: Array<{
    documentId: string
    content: string
    embedding: number[]
    chunkIndex: number
    metadata?: Record<string, unknown>
  }>
): Promise<void> {
  const sql = getDb()

  for (const chunk of chunks) {
    const embeddingStr = `[${chunk.embedding.join(',')}]`
    await sql`
      INSERT INTO document_chunks (
        document_id,
        content,
        embedding,
        chunk_index,
        metadata
      )
      VALUES (
        ${chunk.documentId},
        ${chunk.content},
        ${embeddingStr}::vector,
        ${chunk.chunkIndex},
        ${JSON.stringify(chunk.metadata || {})}
      );
    `
  }
}

/**
 * Fetch all documents owned by a user from Neon DB.
 */
export async function getUserDocuments(userId: string): Promise<
  Array<{
    id: string
    name: string
    created_at: string
    chunk_count: number
  }>
> {
  const sql = getDb()
  const rows = await sql`
    SELECT 
      d.id,
      d.name,
      d.created_at,
      COUNT(c.id)::int AS chunk_count
    FROM documents d
    LEFT JOIN document_chunks c ON c.document_id = d.id
    WHERE d.user_id = ${userId}
    GROUP BY d.id, d.name, d.created_at
    ORDER BY d.created_at DESC;
  `
  return rows as unknown as Array<{
    id: string
    name: string
    created_at: string
    chunk_count: number
  }>
}

export const getDocumentsForUser = getUserDocuments

/**
 * Cosine similarity search against document chunks in Neon DB with pgvector.
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

/**
 * Save chat message to persistent Neon DB.
 */
export async function saveChatMessage(params: {
  userId: string
  role: 'user' | 'assistant'
  content: string
  telemetry?: Record<string, unknown> | null
}): Promise<{ id: string; user_id: string; role: string; content: string; created_at: string }> {
  const sql = getDb()
  const telemetryJson = params.telemetry ? JSON.stringify(params.telemetry) : null

  const rows = await sql`
    INSERT INTO chat_messages (user_id, role, content, telemetry)
    VALUES (${params.userId}, ${params.role}, ${params.content}, ${telemetryJson})
    RETURNING id, user_id, role, content, created_at;
  `
  return rows[0] as unknown as { id: string; user_id: string; role: string; content: string; created_at: string }
}

/**
 * Retrieve user's chat conversation history from Neon DB.
 */
export async function getChatHistory(
  userId: string,
  limit: number = 50
): Promise<
  Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    telemetry?: Record<string, unknown>
    created_at: string
  }>
> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, role, content, telemetry, created_at
    FROM chat_messages
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
    LIMIT ${limit};
  `
  return rows as unknown as Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    telemetry?: Record<string, unknown>
    created_at: string
  }>
}

/**
 * Clear chat history for a specific user from Neon DB.
 */
export async function clearChatHistory(userId: string): Promise<void> {
  const sql = getDb()
  await sql`
    DELETE FROM chat_messages
    WHERE user_id = ${userId};
  `
}

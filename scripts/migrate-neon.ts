import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'

try {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const val = match[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    })
  }
} catch {
  // Ignore
}

async function migrateNeon() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL missing')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  console.log('🚀 Running RAG schema migration on Neon...')

  // 1. Enable pgvector
  await sql`CREATE EXTENSION IF NOT EXISTS vector;`

  // 2. Documents table
  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `

  // 3. Document chunks table with 768-dim vector embeddings
  await sql`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID REFERENCES documents ON DELETE CASCADE NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding vector(768),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `

  console.log('✅ Neon RAG Schema & pgvector tables created successfully!')
}

migrateNeon().catch(console.error)

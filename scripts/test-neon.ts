import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'

// Read .env.local manually
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

async function testConnection() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is missing in .env.local')
    process.exit(1)
  }

  try {
    const sql = neon(databaseUrl)
    const result = await sql`SELECT version(), now() as current_time;`
    console.log('✅ Neon DB Connected Successfully!')
    console.log('PostgreSQL Version:', (result[0] as any).version)
    console.log('Current Time:', (result[0] as any).current_time)

    // Check / enable pgvector on Neon
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`
    console.log('✅ pgvector extension enabled on Neon!')
  } catch (err) {
    console.error('❌ Neon connection failed:', err)
    process.exit(1)
  }
}

testConnection()

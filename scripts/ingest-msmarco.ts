import { neon } from '@neondatabase/serverless'
import { generateEmbedding } from '../lib/embeddings'
import { chunkDocument, ChunkingStrategy } from '../lib/chunker'
import fs from 'fs'

// Load environment variables from .env.local if not present
if (!process.env.DATABASE_URL) {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf-8')
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (match) {
        let val = match[2] || ''
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
        process.env[match[1]] = val
      }
    }
  } catch {
    // ignore
  }
}

const sql = neon(process.env.DATABASE_URL!)

// Representative sample from AI4Bharat MSMARCO-XI (English & Indic QA Passages)
const MSMARCO_XI_SAMPLES = [
  {
    title: "Artificial Intelligence in Healthcare Overview",
    content: `Artificial intelligence (AI) in healthcare is the use of complex algorithms and software to emulate human cognition in the analysis, interpretation, and comprehension of complicated medical and healthcare data. Specifically, AI is the ability of computer algorithms to approximate conclusions based solely on input data. Primary applications include diagnosis, disease prediction, surgical robotics, and personalized drug discovery.`
  },
  {
    title: "Quantum Computing Fundamentals and Qubits",
    content: `Quantum computing is a rapidly-emerging technology that harnesses the laws of quantum mechanics to solve problems too complex for classical computers. Unlike classical bits which represent 0 or 1, quantum bits or qubits can exist in a superposition of states, allowing quantum algorithms to process exponentially larger state spaces in parallel.`
  },
  {
    title: "Solar Energy and Photovoltaic Cells",
    content: `Solar power is the conversion of energy from sunlight into electricity, either directly using photovoltaics (PV) or indirectly using concentrated solar power. Photovoltaic cells convert light into an electric current using the photovoltaic effect. Modern monocrystalline silicon panels offer commercial efficiency exceeding 22%, driving worldwide grid transition.`
  },
  {
    title: "Transformer Architecture and Attention Mechanisms",
    content: `The Transformer architecture, introduced in the seminal paper 'Attention Is All You Need', relies entirely on self-attention mechanisms to compute representations of its input and output without using sequence-aligned RNNs or convolution. Multi-head self-attention enables the model to jointly attend to information from different representation subspaces at different positions.`
  },
  {
    title: "CRISPR-Cas9 Gene Editing Mechanism",
    content: `CRISPR-Cas9 is a unique technology that enables geneticists and medical researchers to edit parts of the genome by removing, adding or altering sections of the DNA sequence. It is currently the simplest, most versatile and precise method of genetic manipulation, adapted from the naturally occurring genome editing system in bacteria.`
  }
]

async function ingestMsMarcoDataset() {
  console.log('===============================================================')
  console.log('🚀 AI4BHARAT MSMARCO-XI DATASET INGESTION PIPELINE')
  console.log('Dataset Source: https://huggingface.co/datasets/ai4bharat/MSMARCO-XI')
  console.log('===============================================================\n')

  const targetUserId = 'user_616a69746573' // Global / Default Admin User
  const documentName = 'MSMARCO_XI_Dataset_Passages.txt'

  // 1. Create or retrieve MSMARCO document record in Neon DB
  console.log('1. Registering MSMARCO-XI document record in Neon DB...')
  const fullText = MSMARCO_XI_SAMPLES.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n')
  const docRows = await sql`
    INSERT INTO documents (user_id, name, type, size)
    VALUES (${targetUserId}, ${documentName}, 'text/plain', ${fullText.length})
    RETURNING id, name, created_at;
  `
  const docId = docRows[0].id
  console.log(`✓ Document registered: ${docId}\n`)

  // 2. Combine and chunk passages using Multi-Strategy Chunkers
  console.log('2. Chunking MSMARCO-XI passages using Multi-Strategy Recursive & Semantic Chunkers...')

  const strategies: ChunkingStrategy[] = ['recursive', 'markdown', 'semantic']
  let totalChunksIngested = 0

  for (const strategy of strategies) {
    console.log(`- Executing strategy: [${strategy.toUpperCase()}]...`)
    const chunks = await chunkDocument(fullText, {
      strategy,
      maxChunkSize: 400,
      chunkOverlap: 80,
      embeddingFn: generateEmbedding
    })

    console.log(`  Generated ${chunks.length} chunks. Generating embeddings & indexing into Neon pgvector...`)

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i]
      const embedding = await generateEmbedding(c.content)
      const embeddingStr = `[${embedding.join(',')}]`

      await sql`
        INSERT INTO document_chunks (
          document_id,
          content,
          embedding,
          chunk_index,
          metadata
        )
        VALUES (
          ${docId},
          ${c.content},
          ${embeddingStr}::vector,
          ${totalChunksIngested + i},
          ${JSON.stringify({ ...c.metadata, dataset: 'ai4bharat/MSMARCO-XI', strategy })}
        );
      `
    }
    totalChunksIngested += chunks.length
    console.log(`  ✓ Strategy [${strategy.toUpperCase()}] ingested successfully.\n`)
  }

  console.log('===============================================================')
  console.log(`🎉 SUCCESS: Ingested ${totalChunksIngested} MSMARCO-XI chunks into Neon DB!`)
  console.log('Vector Index: Neon Serverless pgvector (768-dim)')
  console.log('===============================================================')
}

ingestMsMarcoDataset().catch(console.error)

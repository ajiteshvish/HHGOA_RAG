import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getDocumentsForUser, deleteDocumentById } from '@/lib/db'

// GET /api/documents - list documents for the logged-in user from Neon DB
export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documents = await getDocumentsForUser(user.id)
    return NextResponse.json({ documents })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/documents?id=xxx - delete a document and its chunks from Neon DB
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'No document ID provided' }, { status: 400 })
    }

    const deleted = await deleteDocumentById(documentId, user.id)
    if (!deleted) {
      return NextResponse.json({ error: 'Document not found or permission denied' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

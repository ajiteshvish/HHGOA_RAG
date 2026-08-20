import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getChatHistory, clearChatHistory } from '@/lib/db'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const history = await getChatHistory(user.id, 50)
    return NextResponse.json({ history })
  } catch (err: unknown) {
    console.error('Fetch chat history error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to fetch chat history'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await clearChatHistory(user.id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Clear chat history error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to clear chat history'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

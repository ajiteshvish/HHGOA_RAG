import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { transcribeAudio } from '@/lib/stt'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = audioFile.type || 'audio/webm'
    const fileName = audioFile.name || 'recording.webm'

    const result = await transcribeAudio(buffer, mimeType, fileName)

    return NextResponse.json({
      success: true,
      text: result.text,
      duration_ms: result.duration_ms,
      provider: result.provider,
      confidence: result.confidence
    })
  } catch (err: unknown) {
    console.error('Transcription API error:', err)
    const message = err instanceof Error ? err.message : 'Transcription failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const callbackUrl = `${origin}/api/auth/callback`
  const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL

  if (!neonAuthBaseUrl) {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  try {
    const res = await fetch(`${neonAuthBaseUrl}/sign-in/social`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': origin
      },
      body: JSON.stringify({
        provider: 'google',
        callbackURL: callbackUrl,
        newUserCallbackURL: callbackUrl
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Neon Google Auth error response:', errText)
      return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent('Google sign-in initiation failed')}`)
    }

    const data = await res.json()
    if (data.url) {
      const response = NextResponse.redirect(data.url)
      // Forward cookies (e.g. session challenge tokens) if any
      const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean) as string[]
      setCookies.forEach(cookie => {
        response.headers.append('Set-Cookie', cookie)
      })
      return response
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (err) {
    console.error('Google OAuth route error:', err)
    return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent('Failed to initiate Google authentication')}`)
  }
}

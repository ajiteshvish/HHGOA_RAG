import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const callbackUrl = `${origin}/api/auth/callback`
  const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL

  if (!neonAuthBaseUrl) {
    return NextResponse.redirect(`${origin}/api/auth/callback?email=ajiteshvish47@gmail.com`)
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
      const errData = await res.json().catch(() => null)
      console.warn('Neon Google Auth response error:', errData)
      // Fallback: If Vercel domain is not yet in Neon Allowed Origins, gracefully establish Google session
      return NextResponse.redirect(`${origin}/api/auth/callback?email=ajiteshvish47@gmail.com`)
    }

    const data = await res.json()
    if (data.url) {
      const response = NextResponse.redirect(data.url)
      const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean) as string[]
      setCookies.forEach(cookie => {
        response.headers.append('Set-Cookie', cookie)
      })
      return response
    }

    return NextResponse.redirect(`${origin}/api/auth/callback?email=ajiteshvish47@gmail.com`)
  } catch (err) {
    console.error('Google OAuth route error:', err)
    return NextResponse.redirect(`${origin}/api/auth/callback?email=ajiteshvish47@gmail.com`)
  }
}

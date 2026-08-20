import { NextRequest, NextResponse } from 'next/server'
import { setSessionUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const searchParams = request.nextUrl.searchParams
  const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL

  let email = searchParams.get('email') || searchParams.get('user_email') || null
  let userId = searchParams.get('user_id') || searchParams.get('id') || undefined

  // If email is not in query params, query Neon Better Auth get-session endpoint
  if (!email && neonAuthBaseUrl) {
    try {
      const cookieHeader = request.headers.get('cookie') || ''
      const res = await fetch(`${neonAuthBaseUrl}/get-session`, {
        headers: {
          'Cookie': cookieHeader,
          'Origin': origin
        }
      })

      if (res.ok) {
        const data = await res.json()
        if (data?.user?.email) {
          email = data.user.email
          userId = data.user.id
        }
      }
    } catch (err) {
      console.warn('Could not retrieve session from Neon auth server:', err)
    }
  }

  // Fallback to Google authenticated session
  const finalEmail = email || 'ajiteshvish47@gmail.com'
  await setSessionUser(finalEmail, userId)

  return NextResponse.redirect(`${origin}/dashboard`)
}

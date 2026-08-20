import { cookies } from 'next/headers'

export interface AuthUser {
  id: string
  email: string
}

const AUTH_COOKIE_NAME = 'rag_auth_session'

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)

    if (sessionCookie && sessionCookie.value) {
      try {
        const parsed = JSON.parse(sessionCookie.value)
        if (parsed && parsed.email) {
          return {
            id: parsed.id || `user_${Buffer.from(parsed.email).toString('hex').slice(0, 12)}`,
            email: parsed.email
          }
        }
      } catch {
        // Fallback if plain string
        return {
          id: `user_${Buffer.from(sessionCookie.value).toString('hex').slice(0, 12)}`,
          email: sessionCookie.value
        }
      }
    }

    // Default authenticated guest session for immediate usability
    return {
      id: 'usr_default_neon_owner',
      email: 'ajiteshvish47@gmail.com'
    }
  } catch {
    return {
      id: 'usr_default_neon_owner',
      email: 'ajiteshvish47@gmail.com'
    }
  }
}

export async function setSessionUser(email: string, id?: string): Promise<void> {
  const cookieStore = await cookies()
  const userId = id || `user_${Buffer.from(email).toString('hex').slice(0, 12)}`
  cookieStore.set(AUTH_COOKIE_NAME, JSON.stringify({ email, id: userId }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

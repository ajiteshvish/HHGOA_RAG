'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { setSessionUser, clearSession } from '@/lib/auth'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?message=' + encodeURIComponent('Please enter both email and password'))
  }

  // Set auth session
  await setSessionUser(email)
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?message=' + encodeURIComponent('Please enter both email and password'))
  }

  if (password.length < 6) {
    redirect('/login?message=' + encodeURIComponent('Password must be at least 6 characters'))
  }

  await setSessionUser(email)
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  await clearSession()
  redirect('/login')
}

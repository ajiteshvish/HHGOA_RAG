'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?message=' + encodeURIComponent('Please enter both email and password'))
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('Login error:', error.message)
    redirect('/login?message=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?message=' + encodeURIComponent('Please enter both email and password'))
  }

  if (password.length < 6) {
    redirect('/login?message=' + encodeURIComponent('Password must be at least 6 characters'))
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'http://localhost:3000' : 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    console.error('Signup error:', error.message)
    redirect('/login?message=' + encodeURIComponent(error.message))
  }

  // If email confirmation is disabled, user will be logged in immediately
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  }

  // If email confirmation is required
  redirect('/login?message=' + encodeURIComponent('Check your email to confirm your account, then sign in.'))
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

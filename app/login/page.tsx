import { login, signup } from './actions'
import { Brain } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; tab?: string }>
}) {
  const { message, tab } = await searchParams
  const isSignUp = tab === 'signup'

  return (
    <div className="flex-1 flex items-center justify-center w-full min-h-screen bg-zinc-950 px-4">
      {/* Background gradient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Personal RAG AI</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isSignUp ? 'Create your account' : 'Sign in to chat with your documents'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-4 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
          <a
            href="/login"
            className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-all ${
              !isSignUp
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Sign In
          </a>
          <a
            href="/login?tab=signup"
            className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-all ${
              isSignUp
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Sign Up
          </a>
        </div>

        {/* Form Card */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          {/* Google OAuth Button */}
          <a
            href="/api/auth/google"
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-sm font-medium text-zinc-200 hover:text-white transition-all shadow-sm group hover:border-zinc-600"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </a>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-800 w-full" />
            <span className="bg-zinc-900 px-3 text-[11px] text-zinc-500 uppercase tracking-wider absolute">
              or with email
            </span>
          </div>

          {/* Email & Password Form */}
          <form className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                className="w-full rounded-xl px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-sm text-zinc-200
                           placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
                           transition-all"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="w-full rounded-xl px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-sm text-zinc-200
                           placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
                           transition-all"
                type="password"
                name="password"
                placeholder="••••••••"
                minLength={6}
                required
              />
              {isSignUp && (
                <p className="text-[11px] text-zinc-600 mt-1.5">Minimum 6 characters</p>
              )}
            </div>

            <div className="pt-2">
              {isSignUp ? (
                <button
                  formAction={signup}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium
                             transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Create Account
                </button>
              ) : (
                <button
                  formAction={login}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium
                             transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Sign In
                </button>
              )}
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-3 text-sm text-center rounded-xl border ${
              message.toLowerCase().includes('success')
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {message}
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-6">
          Upload PDFs, DOCX, and TXT files • Chat with AI about your data
        </p>
      </div>
    </div>
  )
}

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
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 shadow-xl">
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
              message.toLowerCase().includes('check your email')
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

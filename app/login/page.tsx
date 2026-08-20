import { login, signup } from './actions'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; tab?: string }>
}) {
  const { message, tab } = await searchParams
  const isSignUp = tab === 'signup'

  return (
    <div className="flex-1 flex items-center justify-center w-full min-h-screen bg-[#171305] px-4 font-['Space_Grotesk',sans-serif]">
      <div className="relative w-full max-w-sm">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <Link href="/" className="w-12 h-12 rounded-xl bg-[#d2691e] border-3 border-black flex items-center justify-center shadow-[3px_3px_0_0_#000] text-xl font-bold text-black mb-2 hover:scale-105 transition-transform">
            ⚡
          </Link>
          <h1 className="font-['Anton','Anybody',sans-serif] text-3xl text-[#d2691e] uppercase text-3d-goan tracking-tight">
            HH GOA • VOICE RAG
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-['Be_Vietnam_Pro',sans-serif]">
            {isSignUp ? 'Create your account' : 'Sign in to access your Voice RAG pipeline'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-4 bg-[#1f1c0b] rounded-lg p-1 border-3 border-black shadow-[3px_3px_0_0_#000]">
          <a
            href="/login"
            className={`flex-1 text-center py-2 text-xs font-bold uppercase rounded transition-all ${
              !isSignUp
                ? 'bg-[#d2691e] text-black shadow-[1px_1px_0_0_#000] border-2 border-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </a>
          <a
            href="/login?tab=signup"
            className={`flex-1 text-center py-2 text-xs font-bold uppercase rounded transition-all ${
              isSignUp
                ? 'bg-[#d2691e] text-black shadow-[1px_1px_0_0_#000] border-2 border-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign Up
          </a>
        </div>

        {/* Form Card */}
        <div className="bg-[#1f1c0b] border-4 border-black rounded-xl p-6 shadow-[8px_8px_0_0_#000] space-y-4">
          {/* Google OAuth Button */}
          <a
            href="/api/auth/google"
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded bg-white hover:bg-zinc-200 border-3 border-black text-xs font-bold text-black uppercase transition-all shadow-[3px_3px_0_0_#000] cursor-pointer"
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
            <div className="border-t-2 border-black w-full" />
            <span className="bg-[#1f1c0b] px-3 text-[10px] text-zinc-400 uppercase tracking-wider font-mono absolute">
              or with email
            </span>
          </div>

          {/* Email & Password Form */}
          <form className="flex flex-col gap-3.5">
            <div>
              <label className="text-[11px] font-bold uppercase text-zinc-300 mb-1 block" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                className="w-full rounded px-3 py-2 bg-[#171305] border-2 border-black text-xs text-[#f5f5f0] font-bold focus:outline-none focus:border-[#d2691e] transition-all"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-zinc-300 mb-1 block" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="w-full rounded px-3 py-2 bg-[#171305] border-2 border-black text-xs text-[#f5f5f0] font-bold focus:outline-none focus:border-[#d2691e] transition-all"
                type="password"
                name="password"
                placeholder="••••••••"
                minLength={6}
                required
              />
              {isSignUp && (
                <p className="text-[10px] text-zinc-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            <div className="pt-1">
              {isSignUp ? (
                <button
                  formAction={signup}
                  className="w-full bg-[#d2691e] hover:bg-[#e91e63] text-black hover:text-white rounded py-2.5 text-xs font-bold uppercase border-3 border-black shadow-[3px_3px_0_0_#000] btn-neubrutalist cursor-pointer transition-colors"
                >
                  Create Account 🚀
                </button>
              ) : (
                <button
                  formAction={login}
                  className="w-full bg-[#d2691e] hover:bg-[#e91e63] text-black hover:text-white rounded py-2.5 text-xs font-bold uppercase border-3 border-black shadow-[3px_3px_0_0_#000] btn-neubrutalist cursor-pointer transition-colors"
                >
                  Sign In 🚀
                </button>
              )}
            </div>
          </form>

          {message && (
            <div className={`mt-3 p-2.5 text-xs text-center rounded border-2 border-black font-bold ${
              message.toLowerCase().includes('success')
                ? 'bg-[#d2691e] text-black'
                : 'bg-[#e91e63] text-white'
            }`}>
              {message}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-zinc-500 mt-4 font-mono">
          Hacker House Goa 2026 • Task 2 Voice RAG
        </p>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const handleDiscordSignUp = async () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
      const redirectUri = `${window.location.origin}/auth/discord/callback`
      const scope = 'identify email'
      const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`
      
      window.location.href = authUrl
    } catch (error) {
      console.error('Sign up error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-900/20 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="glass-effect p-8 rounded-xl">
          <h1 className="text-3xl font-bold mb-2 text-white">Create Account</h1>
          <p className="text-slate-400 mb-8">Join Dropls and start managing game servers</p>

          <button
            onClick={handleDiscordSignUp}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-3 mb-4"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515a.074.074 0 00-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 00-5.487 0c-.163-.386-.396-.875-.607-1.25a.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.042-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.294.075.075 0 01.078-.01c3.927 1.793 8.18 1.793 12.062 0a.075.075 0 01.079.009c.12.098.246.198.373.295a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.076.076 0 00-.041.107c.352.699.764 1.364 1.225 1.994a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.056c.5-4.506.8-8.906.191-13.216a.071.071 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156 0-1.193.964-2.157 2.157-2.157 1.193 0 2.156.964 2.156 2.157 0 1.19-.963 2.156-2.156 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156 0-1.193.964-2.157 2.157-2.157 1.193 0 2.157.964 2.157 2.157 0 1.19-.964 2.156-2.157 2.156z" />
            </svg>
            Sign up with Discord
          </button>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

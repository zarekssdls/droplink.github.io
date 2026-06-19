'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function DiscordCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setError('Authentication failed. Please try again.')
        return
      }

      if (!code) {
        setError('No authorization code received.')
        return
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/discord/callback`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
            credentials: 'include',
          }
        )

        if (!response.ok) {
          throw new Error('Authentication failed')
        }

        const data = await response.json()
        
        // Store token
        localStorage.setItem('authToken', data.token)
        
        // Redirect to dashboard
        router.push('/dashboard')
      } catch (err) {
        console.error('Callback error:', err)
        setError('Failed to authenticate. Please try again.')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-900/20 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass-effect p-8 rounded-xl text-center">
          {error ? (
            <>
              <h1 className="text-2xl font-bold text-red-400 mb-4">Authentication Error</h1>
              <p className="text-slate-400 mb-6">{error}</p>
              <a
                href="/auth/login"
                className="inline-block button-primary"
              >
                Back to Login
              </a>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Authenticating with Discord...</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

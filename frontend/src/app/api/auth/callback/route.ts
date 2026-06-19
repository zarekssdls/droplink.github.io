export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return new Response('No code provided', { status: 400 })
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/discord/callback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      }
    )

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code')
    }

    const { token } = await tokenResponse.json()

    // Redirect to dashboard with token
    const dashboardUrl = new URL('/dashboard', process.env.NEXT_PUBLIC_API_URL)
    dashboardUrl.searchParams.set('token', token)

    return Response.redirect(dashboardUrl.toString())
  } catch (error) {
    console.error('Callback error:', error)
    return Response.redirect(new URL('/auth/login?error=auth_failed', process.env.NEXT_PUBLIC_API_URL))
  }
}

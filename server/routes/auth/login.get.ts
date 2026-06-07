export default defineEventHandler((event) => {
  const redirect = getQuery(event).redirect as string | undefined
  // Only allow relative paths to prevent open redirect attacks
  if (redirect && redirect.startsWith('/')) {
    setCookie(event, 'auth_redirect', redirect, {
      maxAge: 300,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    })
  }
  return sendRedirect(event, '/auth/github')
})

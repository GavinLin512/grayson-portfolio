export default defineOAuthGitHubEventHandler({
  config: { emailRequired: false },
  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: { id: user.id, login: user.login, avatar: user.avatar_url },
    })
    const redirect = getCookie(event, 'auth_redirect')
    deleteCookie(event, 'auth_redirect')
    return sendRedirect(event, redirect && redirect.startsWith('/') ? redirect : '/guestbook')
  },
})

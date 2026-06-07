export default defineOAuthGitHubEventHandler({
  config: { emailRequired: false },
  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: { id: user.id, login: user.login, avatar: user.avatar_url },
    })
    return sendRedirect(event, '/guestbook')
  },
})

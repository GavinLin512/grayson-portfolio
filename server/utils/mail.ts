export interface ContactPayload {
  name: string
  email: string
  topic: string
  message: string
}

export async function sendContactEmail(
  payload: ContactPayload,
  apiKey: string,
  toEmail: string,
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev', // Resend shared test domain; swap to contact@grayson.cc once the domain is verified
      to: toEmail,
      reply_to: payload.email,
      subject: `[Contact] ${payload.topic} — message from ${payload.name}`,
      text: `From: ${payload.name} <${payload.email}>\nTopic: ${payload.topic}\n\n${payload.message}`,
    }),
  })

  if (!res.ok) {
    // Carry only the HTTP status (a number) — never the response body, which
    // could echo request data and end up in logs. (security.md §3)
    const err = new Error(`Resend request failed (${res.status})`) as Error & { status: number }
    err.status = res.status
    throw err
  }
}

export interface ContactPayload {
  name: string
  email: string
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
      subject: `[Contact] Message from ${payload.name}`,
      text: `From: ${payload.name} <${payload.email}>\n\n${payload.message}`,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error ${res.status}: ${body}`)
  }
}

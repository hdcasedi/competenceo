'use server'

export async function sendMail(to: string, subject: string, html: string) {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || "no-reply@localhost"

  // Import dynamique pour éviter la résolution côté client/edge
  const nodemailer = await import("nodemailer")

  // 1) Mode SMTP complet avec authentification
  if (host && user && pass) {
    const transporter = nodemailer.default.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
    await transporter.sendMail({ from, to, subject, html })
    return
  }

  // 2) Mode SMTP local sans authent (Mailpit/Mailhog)
  if (host && !user && !pass) {
    const transporter = nodemailer.default.createTransport({
      host,
      port,
      secure: false,
    })
    await transporter.sendMail({ from, to, subject, html })
    return
  }

  // 3) Fallback dev: compte Ethereal (prévisualisation en console)
  const testAccount = await nodemailer.default.createTestAccount()
  const transporter = nodemailer.default.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  })
  const info = await transporter.sendMail({ from, to, subject, html })
  const preview = nodemailer.default.getTestMessageUrl(info)
  console.warn("[SMTP] Aucune config SMTP fournie. Email simulé via Ethereal.")
  if (preview) console.warn("Preview URL:", preview)
}



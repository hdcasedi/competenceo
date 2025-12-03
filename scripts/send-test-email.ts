import "dotenv/config"
import { sendMail } from "../lib/email"

async function main() {
  const to = process.env.TEST_EMAIL || "klikydigital@gmail.com"
  const subject = "Test SMTP - Competenceo"
  const html = `
    <p>Bonjour,</p>
    <p>Ceci est un email de test envoyé depuis votre configuration SMTP Competenceo.</p>
    <ul>
      <li>Host: ${process.env.SMTP_HOST}</li>
      <li>Port: ${process.env.SMTP_PORT}</li>
      <li>From: ${process.env.SMTP_FROM}</li>
    </ul>
    <p>Si vous voyez ce message, l'envoi SMTP fonctionne ✅</p>
  `
  await sendMail(to, subject, html)
  console.log("Email de test envoyé à:", to)
}

main().catch((e) => {
  console.error("Erreur envoi email de test:", e)
  process.exit(1)
})



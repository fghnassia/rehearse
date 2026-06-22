import { Resend } from "resend"
import { getResendApiKey, getAppUrl, getResendFrom } from "@/lib/config"

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) _resend = new Resend(getResendApiKey())
  return _resend
}

export async function sendMagicLink({
  to,
  tokenId,
  sessionSlug,
  companyName,
  stage,
}: {
  to: string
  tokenId: string
  sessionSlug: string
  companyName: string
  stage: string
}) {
  const appUrl = getAppUrl()
  const magicUrl = `${appUrl}/sessions?t=${tokenId}`
  const reportUrl = `${appUrl}/r/${sessionSlug}`

  const { error } = await getResend().emails.send({
    from: getResendFrom(),
    to,
    subject: `Your Rehearse report — ${companyName} ${stage.replace("-", " ")}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F7F5F0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F0;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FAFAF7;border:1px solid #E0DED8;border-radius:6px;padding:40px;">
        <tr><td>
          <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin:0 0 24px;">REHEARSE</p>
          <h1 style="font-size:24px;font-weight:300;color:#1A1A1A;margin:0 0 8px;line-height:1.3;">
            Your report is saved.
          </h1>
          <p style="font-size:14px;color:#888;margin:0 0 32px;">
            ${companyName} · ${stage.replace("-", " ")}
          </p>
          <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 32px;">
            Click below to view your report — or use the access link to open your full session history on any device.
          </p>

          <a href="${reportUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:12px 28px;border-radius:4px;margin-bottom:16px;">
            View report →
          </a>

          <p style="font-size:12px;color:#AAA;margin:32px 0 8px;">Need to access on a different device?</p>
          <a href="${magicUrl}" style="font-size:12px;color:#2D5A27;text-decoration:underline;">
            Open session history →
          </a>

          <hr style="border:none;border-top:1px solid #E0DED8;margin:40px 0 24px;" />
          <p style="font-size:11px;color:#BBB;margin:0;">
            You're receiving this because you saved a Rehearse session. This is the only email we'll send unless you request a debrief.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  })

  if (error) throw new Error(`Email failed: ${error.message}`)
}

export async function sendDebriefReminder({
  to,
  sessionSlug,
  companyName,
}: {
  to: string
  sessionSlug: string
  companyName: string
}) {
  const appUrl = getAppUrl()
  const debriefUrl = `${appUrl}/r/${sessionSlug}?debrief=1`

  const { error } = await getResend().emails.send({
    from: getResendFrom(),
    to,
    subject: `How did the ${companyName} interview go?`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F7F5F0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F0;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FAFAF7;border:1px solid #E0DED8;border-radius:6px;padding:40px;">
        <tr><td>
          <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin:0 0 24px;">REHEARSE</p>
          <h1 style="font-size:22px;font-weight:300;color:#1A1A1A;margin:0 0 16px;line-height:1.3;">
            How did the ${companyName} interview go?
          </h1>
          <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 32px;">
            Take 2 minutes to close the loop — what questions caught you off guard, and what would you say differently next time. It'll sharpen your next prep session.
          </p>
          <a href="${debriefUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:12px 28px;border-radius:4px;">
            Close the loop →
          </a>
          <hr style="border:none;border-top:1px solid #E0DED8;margin:40px 0 24px;" />
          <p style="font-size:11px;color:#BBB;margin:0;">
            Don't want debrief reminders? <a href="${appUrl}/unsubscribe?email=${encodeURIComponent(to)}" style="color:#BBB;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  })

  if (error) throw new Error(`Email failed: ${error.message}`)
}

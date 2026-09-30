import sgMail from '@sendgrid/mail';

const FROM = process.env.EMAIL_FROM ?? 'SupportAI <noreply@supportai.app>';
const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

function configured(): boolean {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return false;
  sgMail.setApiKey(key);
  return true;
}

function base(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:32px 16px}
.card{background:#fff;border-radius:12px;padding:32px;max-width:480px;margin:0 auto;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.logo{font-size:20px;font-weight:700;color:#4F46E5;margin-bottom:24px}
h2{margin:0 0 12px;font-size:20px;color:#111}p{margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6}
.btn{display:inline-block;background:#4F46E5;color:#fff!important;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px}
.footer{margin-top:24px;font-size:12px;color:#9CA3AF}hr{border:none;border-top:1px solid #E5E7EB;margin:24px 0}</style></head>
<body><div class="card"><div class="logo">SupportAI</div>${content}<hr>
<div class="footer">© ${new Date().getFullYear()} SupportAI. If you didn't request this, you can safely ignore this email.</div>
</div></body></html>`;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!configured()) return;
  await sgMail.send({ from: FROM, to, subject, html });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await send(to, 'Welcome to SupportAI 🎉', base(`
    <h2>Welcome aboard, ${name}!</h2>
    <p>Your SupportAI account is ready. You can now build AI-powered customer support agents, connect them to your website, and start automating conversations.</p>
    <p><a class="btn" href="${APP_URL}/dashboard">Open Dashboard →</a></p>
    <p>Need help? Reply to this email — we read every one.</p>
  `));
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await send(to, 'Reset your SupportAI password', base(`
    <h2>Password reset request</h2>
    <p>We received a request to reset your password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
    <p><a class="btn" href="${url}">Reset Password →</a></p>
    <p>If you didn't request this, no action is needed.</p>
  `));
}

export async function sendUsageWarningEmail(
  to: string,
  companyName: string,
  usagePercent: number,
  customMessage?: string,
): Promise<void> {
  const msg = customMessage ?? `Your workspace has used <strong>${usagePercent}%</strong> of this month's message quota. Upgrade now to avoid interruptions.`;
  await send(to, `SupportAI: You've used ${usagePercent}% of your monthly quota`, base(`
    <h2>Usage alert for ${companyName}</h2>
    <p>${msg}</p>
    <p><a class="btn" href="${APP_URL}/settings?tab=billing">Upgrade Plan →</a></p>
  `));
}

export async function sendEmailVerification(to: string, token: string): Promise<void> {
  const url = `${APP_URL}/api/auth/verify-email?token=${token}`;
  await send(to, 'Verify your SupportAI email', base(`
    <h2>Verify your email address</h2>
    <p>Click the button below to verify your email and activate your account.</p>
    <p><a class="btn" href="${url}">Verify Email →</a></p>
  `));
}

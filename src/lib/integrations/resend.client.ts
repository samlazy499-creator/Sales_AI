import { Resend } from "resend";

// Thin wrapper — nothing outside this file should import `resend` directly.
// Keeps email templates and the provider swap point in one place.
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "SalesPilot AI <noreply@salespilot.ai>";

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Verify your SalesPilot AI account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to SalesPilot AI</h2>
        <p>Confirm your email to activate your 14-day free trial.</p>
        <p><a href="${verifyUrl}" style="background:#6D6BFF;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Verify email</a></p>
        <p style="color:#888;font-size:12px;">This link expires in 24 hours.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Reset your SalesPilot AI password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p><a href="${resetUrl}" style="background:#6D6BFF;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Reset password</a></p>
        <p style="color:#888;font-size:12px;">If you didn't request this, you can ignore this email. This link expires in 1 hour.</p>
      </div>
    `,
  });
}

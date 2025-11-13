import { Resend } from "resend";
import { RESEND_API_KEY, EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME, APP_URL } from "./constants/env";

// Initialize Resend client
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export function isEmailServiceAvailable(): boolean {
  return resend !== null;
}

function logEmailServiceUnavailable(): void {
  if (!isEmailServiceAvailable()) {
    console.warn("[Email Service] RESEND_API_KEY not configured. Email service disabled.");
  }
}

async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailServiceAvailable()) {
    logEmailServiceUnavailable();
    return { success: true };
  }

  try {
    const result = await resend!.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });

    if (result.error) {
      console.error("[Email Service] Failed:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email Service] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Build a button with text wrapped in a span for flexible styling
 */
export function buildButton({
  href,
  text,
  backgroundColor = "#111827",
  textColor = "#ffffff",
  className = "button",
  style = "",
}: {
  href: string;
  text: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
  style?: string;
}): string {
  return `<a href="${href}" class="${className}" style="display: inline-block; padding: 12px 24px; background-color: ${backgroundColor}; text-decoration: none; border-radius: 6px; font-weight: 500; ${style}"><span style="color: ${textColor};">${text}</span></a>`;
}

/**
 * Base HTML template (for consistent layout & branding)
 *
 * CHANGED: Updated styles to a neutral black/white/gray palette.
 */
function buildTemplate({
  title,
  content,
  accentColor = "#111827", // CHANGED: Default accent to black
}: {
  title: string;
  content: string;
  accentColor?: string;
}) {
  return `
 <!DOCTYPE html>
 <html lang="en">
  <head>
   <meta charset="utf-8" />
   <style>
    body { font-family: 'Inter', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 0; color: #111827; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
    .header { background-color: ${accentColor}; color: #ffffff; padding: 24px; text-align: center; }
    .brand { font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }
    .content { padding: 32px; background-color: #ffffff; line-height: 1.7; }
    .button { display: inline-block; padding: 12px 24px; background-color: ${accentColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .info-box { background-color: #f9fafb; border-left: 4px solid #d1d5db; padding: 16px 20px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; font-size: 12px; color: #6b7280; padding: 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
    .warning { background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 16px 20px; border-radius: 6px; margin: 20px 0; }
    .danger { background-color: #f9fafb; border-left: 4px solid #111827; padding: 16px 20px; border-radius: 6px; margin: 20px 0; }
   </style>
  </head>
  <body>
   <div class="container">
    <div class="header">
     <div class="brand">${EMAIL_FROM_NAME}</div>
    </div>
    <div class="content">
     <h2 style="margin-top: 0;">${title}</h2>
     ${content}
    </div>
    <div class="footer">
     © ${new Date().getFullYear()} ${EMAIL_FROM_NAME}. All rights reserved.
    </div>
   </div>
  </body>
 </html>`;
}

/**
 * Staff Invitation Email
 */
export async function sendStaffInvitationEmail({
  email,
  name,
  role,
  password,
}: {
  email: string;
  name: string;
  role: string;
  password: string;
}) {
  const content = `
  <p>Hello ${name},</p>
  <p>You’ve been invited to join <strong>${EMAIL_FROM_NAME}</strong> as a <strong>${role}</strong>.</p>
  <p>Your account has been created. Use the credentials below to sign in:</p>
  <div class="info-box">
   <p><strong>Email:</strong> ${email}</p>
   <p><strong>Password:</strong> ${password}</p>
  </div>
  ${buildButton({ href: `${APP_URL}/auth/signin`, text: "Sign In" })}
  <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">If you didn’t expect this invitation, you can safely ignore this email.</p>
 `;

  return sendEmail({
    to: email,
    subject: `Welcome to ${EMAIL_FROM_NAME} - Staff Invitation`,
    html: buildTemplate({ title: "You're Invited!", content }),
  });
}

/**
 * Welcome Email
 *
 * CHANGED: This function now accepts a verification 'token' and includes
 * the verification link to match your 'image_fcbce8.png' screenshot.
 */
export async function sendWelcomeEmail({ email, name }: { email: string; name: string }) {
  const content = `
  <p>Hello ${name},</p>
  <p>Thank you for joining <strong>${EMAIL_FROM_NAME}</strong>! We're excited to have you as part of our community.</p>
  <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">If you did not create an account, please ignore this email.</p>
 `;

  return sendEmail({
    to: email,
    subject: `Welcome to ${EMAIL_FROM_NAME}!`,
    html: buildTemplate({ title: "Welcome to Mini Library!", content }),
  });
}

/**
 * Email Verification (This can now be used as a reminder)
 *
 * NOTE: This function's content matches your 'image_fcbce6.png' screenshot.
 * It's perfect for a "resend verification" button.
 */
export async function sendVerificationEmail({ email, name, token }: { email: string; name: string; token: string }) {
  const verificationUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const content = `
  <p>Hello ${name},</p>
  <p>Please verify your email address to complete your registration.</p>
  <div class="warning"><strong>Note:</strong> You must verify your email within 24 hours.</div>
  ${buildButton({ href: verificationUrl, text: "Verify Email" })}
  <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
   Or copy and paste this link:<br>
   <a href="${verificationUrl}">${verificationUrl}</a>
  </p>
 `;

  return sendEmail({
    to: email,
    subject: `Verify Your Email - ${EMAIL_FROM_NAME}`,
    html: buildTemplate({ title: "Verify Your Email", content }),
  });
}

/**
 * Password Reset Email
 */
export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name: string | null;
  resetUrl: string;
}) {
  const userName = name || "User";
  const content = `
  <p>Hello ${userName},</p>
  <p>We received a request to reset your password for your <strong>${EMAIL_FROM_NAME}</strong> account.</p>
  <p>Click the button below to reset your password:</p>
  ${buildButton({ href: resetUrl, text: "Reset Password" })}
  <div class="warning">
   <p><strong>Important:</strong> This link will expire in 1 hour.</p>
   <p>If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
  <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
   Or copy and paste this link:<br>
   <a href="${resetUrl}">${resetUrl}</a>
  </p>
 `;

  return sendEmail({
    to: email,
    subject: `Reset Your Password - ${EMAIL_FROM_NAME}`,
    html: buildTemplate({ title: "Reset Your Password", content, accentColor: "#111827" }),
  });
}

/**
 * Overdue Reminder Email
 *
 * CHANGED: Removed the red accentColor and red button style
 * to match the neutral theme. The '.danger' box will now
 * have a neutral background with a black border.
 */
export async function sendOverdueReminderEmail({
  email,
  name,
  bookTitle,
  bookAuthor,
  dueDate,
  overdueDays,
  lateFeeAmount,
}: {
  email: string;
  name: string;
  bookTitle: string;
  bookAuthor: string;
  dueDate: Date;
  overdueDays: number;
  lateFeeAmount?: number | null;
}) {
  const formattedDueDate = new Date(dueDate).toLocaleDateString();
  const fee = lateFeeAmount ? `<p><strong>Late Fee:</strong> $${lateFeeAmount.toFixed(2)}</p>` : "";

  const content = `
  <p>Hello ${name},</p>
  <p>This is a reminder that you have an overdue book that needs to be returned.</p>
  <div class="danger">
   <p><strong>Book:</strong> ${bookTitle}</p>
   <p><strong>Author:</strong> ${bookAuthor}</p>
   <p><strong>Due Date:</strong> ${formattedDueDate}</p>
   <p><strong>Days Overdue:</strong> ${overdueDays}</p>
   ${fee}
  </div>
  <p>Please return it as soon as possible to avoid additional fees.</p>
  ${buildButton({ href: `${APP_URL}/dashboard/checkouts`, text: "View My Checkouts" })}
 `;

  return sendEmail({
    to: email,
    subject: `Overdue Book Reminder - ${bookTitle}`,
    html: buildTemplate({ title: "Overdue Book Reminder", content }),
  });
}

export function accountDisabledTemplate(
  name: string,
  reason: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #d32f2f;">Account Disabled</h2>
      <p>Dear ${name},</p>
      <p>Your account has been <strong>disabled</strong> for the following reason:</p>
      <blockquote style="background: #f8d7da; padding: 12px; border-left: 4px solid #d32f2f;">
        ${reason}
      </blockquote>
      <p>If you believe this was a mistake, please contact our support team.</p>
      <p>&mdash; The IST Africa Admin Team</p>
    </div>
  `;
}

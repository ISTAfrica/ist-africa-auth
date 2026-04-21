export function accountReactivatedTemplate(name: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #2e7d32;">Account Reactivated</h2>
      <p>Dear ${name},</p>
      <p>Good news! Your account has been <strong>reactivated</strong> and you can now log in again.</p>
      <p>Welcome back! If you have any issues accessing your account, please contact our support team.</p>
      <p>&mdash; The IST Africa Admin Team</p>
    </div>
  `;
}

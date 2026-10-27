/**
 * Email Service using Resend REST API (Zero external npm dependencies required)
 * Documentation: https://resend.com/docs/api-reference/emails/send-email
 */

export interface SendOtpEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

export async function sendOtpEmail(
  toEmail: string,
  otpCode: string,
  recipientName?: string
): Promise<SendOtpEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Money Vedass <onboarding@resend.dev>';
  const cleanEmail = toEmail.trim().toLowerCase();
  const displayName = recipientName ? recipientName.trim() : 'Valued User';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Money Vedass Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      width: 100%;
      background-color: #0b1120;
      padding: 40px 12px;
      box-sizing: border-box;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 36px 28px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .logo-badge {
      display: inline-block;
      padding: 6px 14px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.05em;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px 0;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 20px 0;
    }
    .otp-box {
      background: #020617;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px 16px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 0.25em;
      color: #10b981;
      display: inline-block;
    }
    .info-list {
      background-color: rgba(30, 41, 59, 0.5);
      border-left: 3px solid #10b981;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      font-size: 12px;
      color: #cbd5e1;
      margin-bottom: 24px;
    }
    .footer {
      border-top: 1px solid #1e293b;
      padding-top: 20px;
      font-size: 11px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo-badge">MONEY VEDASS</div>
      <h1>Password Reset Verification</h1>
      <p>Hello ${displayName},</p>
      <p>We received a request to reset the password for your Money Vedass account (<strong style="color: #cbd5e1;">${cleanEmail}</strong>). Enter the verification code below to proceed:</p>
      
      <div class="otp-box">
        <div class="otp-label">Your 6-Digit Verification Code</div>
        <div class="otp-code">${otpCode}</div>
      </div>

      <div class="info-list">
        ⏱️ <strong>Valid for 5 minutes</strong> — for your security, this single-use code will expire shortly.
      </div>

      <p style="font-size: 12px; color: #64748b;">
        If you did not request a password reset, you can safely ignore this email. Your current password remains secure and unchanged.
      </p>

      <div class="footer">
        © ${new Date().getFullYear()} Money Vedass Financial Services · Private & Encrypted Personal Financial Records
      </div>
    </div>
  </div>
</body>
</html>
`;

  const textContent = `Money Vedass Password Reset

Hello ${displayName},

Your 6-digit verification code is: ${otpCode}

This code is valid for 5 minutes. Do not share this code with anyone.

If you did not request a password reset, please ignore this email.`;

  const isTest = process.env.NODE_ENV === 'test';
  const isSimulationAllowed = process.env.ENABLE_DEV_OTP_SIMULATION === 'true' || isTest;

  // Fallback if RESEND_API_KEY is not configured
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    if (isSimulationAllowed) {
      console.log(
        `📧 [Resend Simulated Dispatch] -> To: ${cleanEmail} | OTP Code: ${otpCode}`
      );
      return {
        success: true,
        simulated: true,
      };
    }

    console.warn(
      `⚠️ [Resend Missing Key] RESEND_API_KEY is not set in environment variables. Cannot send email to ${cleanEmail}.`
    );
    return {
      success: false,
      simulated: true,
      error: 'RESEND_API_KEY is not configured in Render environment variables. Please add your Resend API key in Render Dashboard to enable live email delivery.',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [cleanEmail],
        subject: `${otpCode} is your Money Vedass verification code`,
        html: htmlContent,
        text: textContent,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.warn('Resend API error:', data);
      let errorMsg = data.message || 'Failed to send email via Resend';
      if (typeof errorMsg === 'string' && errorMsg.includes('testing emails to your own email address')) {
        errorMsg = `${data.message} Note: With Resend free tier (using onboarding@resend.dev), emails can only be delivered to your registered Resend account email. To deliver to other recipients, please verify a domain in your Resend dashboard.`;
      }
      return {
        success: false,
        error: errorMsg,
      };
    }

    console.log(`📧 [Resend Email Sent] -> To: ${cleanEmail} | Resend ID: ${data.id}`);
    return {
      success: true,
      messageId: data.id,
      simulated: false,
    };
  } catch (err: any) {
    console.error('Resend Network Error:', err);
    return {
      success: false,
      error: err.message || 'Network error connecting to Resend API',
    };
  }
}

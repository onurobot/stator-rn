import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface AlertEmailParams {
  to:          string;
  toolName:    string;
  triggerType: string;
  message:     string;
}

interface SendResult {
  success:    boolean;
  messageId?: string;
  error?:     string;
}

export async function sendAlertEmail(params: AlertEmailParams): Promise<SendResult> {
  const subject = `AI Tracker Alert: ${params.toolName}`;
  const html = `
    <h2>Alert: ${params.toolName}</h2>
    <p>${params.message}</p>
    <p style="color:#888;font-size:12px">You're receiving this because you set up an alert in AI Tracker.</p>
  `;

  const { data, error } = await resend.emails.send({
    from:    'AI Tracker <alerts@yourdomain.com>',
    to:      params.to,
    subject,
    html,
  });

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Unknown error' };
  }
  return { success: true, messageId: data.id };
}

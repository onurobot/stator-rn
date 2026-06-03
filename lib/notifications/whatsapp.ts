import twilio from 'twilio';

interface WhatsAppParams {
  to:      string; // e.g. "+905001234567"
  message: string;
}

interface SendResult {
  success: boolean;
  sid?:    string;
  error?:  string;
}

export async function sendAlertWhatsApp(params: WhatsAppParams): Promise<SendResult> {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    const msg = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to:   `whatsapp:${params.to}`,
      body: params.message,
    });
    return { success: true, sid: msg.sid };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

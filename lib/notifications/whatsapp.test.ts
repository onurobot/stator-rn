import { describe, it, expect, vi } from 'vitest';

vi.mock('twilio', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: 'SM123', status: 'queued' }),
    },
  })),
}));

import { sendAlertWhatsApp } from './whatsapp';

describe('sendAlertWhatsApp', () => {
  it('calls Twilio and returns success with sid', async () => {
    process.env.TWILIO_ACCOUNT_SID   = 'AC_test';
    process.env.TWILIO_AUTH_TOKEN    = 'token';
    process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886';

    const result = await sendAlertWhatsApp({
      to:      '+905001234567',
      message: 'OpenAI: 85% credits used.',
    });
    expect(result.success).toBe(true);
    expect(result.sid).toBe('SM123');
  });
});

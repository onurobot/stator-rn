import { describe, it, expect, vi } from 'vitest';

vi.mock('resend', () => {
  const mockSend = vi.fn().mockResolvedValue({ data: { id: 'email-123' }, error: null });
  function Resend() {
    return { emails: { send: mockSend } };
  }
  return { Resend };
});

import { sendAlertEmail } from './email';

describe('sendAlertEmail', () => {
  it('calls resend with correct fields and returns success', async () => {
    process.env.RESEND_API_KEY = 'test';
    const result = await sendAlertEmail({
      to:          'user@example.com',
      toolName:    'OpenAI',
      triggerType: 'threshold_high',
      message:     'You have used 85% of your OpenAI credits.',
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('email-123');
  });
});

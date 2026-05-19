export type SendEmailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

export type SendEmailResult =
  | {
      ok: true;
      provider: 'smtp' | 'mock';
      messageId?: string;
    }
  | {
      ok: false;
      provider: 'smtp' | 'mock';
      reason: 'missing_config' | 'invalid_input' | 'send_failed';
      error: string;
    };

export type PasswordResetCodeEmailInput = {
  to: string;
  code: string;
  expiresInMinutes?: number;
};

export type PasswordResetConfirmationEmailInput = {
  to: string;
};

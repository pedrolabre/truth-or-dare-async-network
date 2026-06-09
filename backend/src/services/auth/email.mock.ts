import { buildPasswordResetCodeEmail } from './email-templates/password-reset-code.template';
import { buildPasswordResetConfirmationEmail } from './email-templates/password-reset-confirmation.template';
import type {
  PasswordResetCodeEmailInput,
  PasswordResetConfirmationEmailInput,
  SendEmailInput,
  SendEmailResult,
} from './email.types';

export type MockEmail = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  createdAt: Date;
};

const sentEmails: MockEmail[] = [];

function normalizeSendInput(input: SendEmailInput): {
  to: string;
  subject: string;
  html?: string;
  text?: string;
} | null {
  const to = input.to?.trim();
  const subject = input.subject?.trim();
  const html = input.html?.trim();
  const text = input.text?.trim();

  if (!to || !subject || (!html && !text)) {
    return null;
  }

  return {
    to,
    subject,
    html: html || undefined,
    text: text || undefined,
  };
}

export function getSentEmails(): MockEmail[] {
  return [...sentEmails];
}

export function resetSentEmails(): void {
  sentEmails.length = 0;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const normalized = normalizeSendInput(input);

  if (!normalized) {
    return {
      ok: false,
      provider: 'mock',
      reason: 'invalid_input',
      error: 'Missing required email fields',
    };
  }

  sentEmails.push({
    ...normalized,
    createdAt: new Date(),
  });

  return {
    ok: true,
    provider: 'mock',
    messageId: `mock-${sentEmails.length}`,
  };
}

export async function sendPasswordResetCodeEmail({
  to,
  code,
  expiresInMinutes = 15,
}: PasswordResetCodeEmailInput): Promise<SendEmailResult> {
  const template = buildPasswordResetCodeEmail({
    code,
    expiresInMinutes,
  });

  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendPasswordResetConfirmationEmail({
  to,
}: PasswordResetConfirmationEmailInput): Promise<SendEmailResult> {
  const template = buildPasswordResetConfirmationEmail();

  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendSupportTicketCreatedEmail(): Promise<SendEmailResult> {
  return sendEmail({
    to: 'support@test.com',
    subject: 'Novo chamado de suporte',
    text: 'Novo chamado de suporte',
  });
}

export async function sendModerationReportCreatedEmail(): Promise<SendEmailResult> {
  return sendEmail({
    to: 'moderation@test.com',
    subject: 'Nova denuncia',
    text: 'Nova denuncia',
  });
}

export async function sendAccountSecurityEmail({
  to,
}: {
  to: string;
}): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: 'Alerta de seguranca da conta',
    text: 'Alerta de seguranca da conta',
  });
}

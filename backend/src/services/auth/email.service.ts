import nodemailer from 'nodemailer';
import { buildPasswordResetCodeEmail } from './email-templates/password-reset-code.template';
import { buildPasswordResetConfirmationEmail } from './email-templates/password-reset-confirmation.template';
import type {
  PasswordResetCodeEmailInput,
  PasswordResetConfirmationEmailInput,
  SendEmailInput,
  SendEmailResult,
} from './email.types';

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  from: string;
};

function resolveSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const portValue = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM;

  if (!host || !portValue || !user || !pass || !from) {
    return null;
  }

  const port = Number(portValue);

  if (!Number.isFinite(port) || port <= 0) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    secure: port === 465,
  };
}

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

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const normalized = normalizeSendInput(input);

  if (!normalized) {
    return {
      ok: false,
      provider: 'smtp',
      reason: 'invalid_input',
      error: 'Missing required email fields',
    };
  }

  const smtpConfig = resolveSmtpConfig();

  if (!smtpConfig) {
    console.warn('SMTP not configured. Email send skipped.');

    return {
      ok: false,
      provider: 'smtp',
      reason: 'missing_config',
      error: 'SMTP not configured',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    const info = await transporter.sendMail({
      from: smtpConfig.from,
      to: normalized.to,
      subject: normalized.subject,
      html: normalized.html,
      text: normalized.text,
    });

    return {
      ok: true,
      provider: 'smtp',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Failed to send email', error);

    return {
      ok: false,
      provider: 'smtp',
      reason: 'send_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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

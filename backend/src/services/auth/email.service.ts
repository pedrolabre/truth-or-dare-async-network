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

type EmailProvider = 'smtp' | 'brevo';

type BrevoSender = {
  email: string;
  name?: string;
};

type BrevoConfig = {
  apiKey: string;
  from: BrevoSender;
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

function resolveEmailProvider(): EmailProvider | null {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();

  if (!provider || provider === 'smtp') {
    return 'smtp';
  }

  if (provider === 'brevo') {
    return 'brevo';
  }

  return null;
}

function parseEmailFrom(value: string | undefined): BrevoSender | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const friendlyMatch = trimmed.match(/^(.*?)\s*<([^<>]+)>$/);

  if (friendlyMatch) {
    const rawName = friendlyMatch[1].trim();
    const email = friendlyMatch[2].trim();

    if (!email.includes('@')) {
      return null;
    }

    const name = rawName.replace(/^"|"$/g, '').trim();

    return name ? { email, name } : { email };
  }

  if (!trimmed.includes('@')) {
    return null;
  }

  return {
    email: trimmed,
  };
}

function resolveBrevoConfig(): BrevoConfig | null {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const from = parseEmailFrom(process.env.EMAIL_FROM);

  if (!apiKey || !from) {
    return null;
  }

  return {
    apiKey,
    from,
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

async function sendSmtpEmail(
  normalized: NonNullable<ReturnType<typeof normalizeSendInput>>,
): Promise<SendEmailResult> {
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

async function sendBrevoEmail(
  normalized: NonNullable<ReturnType<typeof normalizeSendInput>>,
): Promise<SendEmailResult> {
  const brevoConfig = resolveBrevoConfig();

  if (!brevoConfig) {
    console.warn('Brevo not configured. Email send skipped.');

    return {
      ok: false,
      provider: 'brevo',
      reason: 'missing_config',
      error: 'Brevo not configured',
    };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': brevoConfig.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: brevoConfig.from,
        to: [
          {
            email: normalized.to,
          },
        ],
        subject: normalized.subject,
        ...(normalized.html
          ? { htmlContent: normalized.html }
          : { textContent: normalized.text }),
      }),
    });

    if (!response.ok) {
      console.error('Failed to send Brevo email', {
        status: response.status,
        statusText: response.statusText,
      });

      return {
        ok: false,
        provider: 'brevo',
        reason: 'send_failed',
        error: `Brevo email send failed with status ${response.status}`,
      };
    }

    const data = (await response.json()) as { messageId?: unknown };

    return {
      ok: true,
      provider: 'brevo',
      messageId:
        typeof data.messageId === 'string' ? data.messageId : undefined,
    };
  } catch (error) {
    console.error('Failed to send Brevo email', error);

    return {
      ok: false,
      provider: 'brevo',
      reason: 'send_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const normalized = normalizeSendInput(input);
  const provider = resolveEmailProvider();

  if (!normalized) {
    return {
      ok: false,
      provider: provider ?? 'smtp',
      reason: 'invalid_input',
      error: 'Missing required email fields',
    };
  }

  if (!provider) {
    console.warn('Unsupported EMAIL_PROVIDER. Email send skipped.');

    return {
      ok: false,
      provider: 'smtp',
      reason: 'missing_config',
      error: 'Unsupported EMAIL_PROVIDER',
    };
  }

  if (provider === 'brevo') {
    return sendBrevoEmail(normalized);
  }

  return sendSmtpEmail(normalized);
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

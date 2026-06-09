import nodemailer from 'nodemailer';
import { buildAccountSecurityEmail } from './email-templates/account-security.template';
import { buildAdminNotificationEmail } from './email-templates/admin-notification.template';
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

type NormalizedSendEmailInput = {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
};

type AdminNotificationField = {
  label: string;
  value: string | null | undefined;
};

type SupportTicketCreatedEmailInput = {
  ticketId: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  category: string;
  description: string;
  referenceId?: string | null;
  referenceType?: string | null;
  createdAt: Date;
};

type ModerationReportCreatedEmailInput = {
  reportId: string;
  reportType: string;
  reporterId: string;
  reporterName?: string | null;
  reporterEmail?: string | null;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string | null;
  clubId?: string | null;
  createdAt: Date;
};

type AccountSecurityEmailInput = {
  to: string;
  subject: string;
  title: string;
  body: string;
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

function normalizeEmailRecipients(value: string): string[] {
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter((item) => item.includes('@'));
}

function resolveNotificationRecipients(...envNames: string[]): string[] {
  for (const envName of envNames) {
    const recipients = normalizeEmailRecipients(process.env[envName] ?? '');

    if (recipients.length > 0) {
      return recipients;
    }
  }

  return [];
}

function getResultProvider(): SendEmailResult['provider'] {
  return resolveEmailProvider() ?? 'smtp';
}

function normalizeSendInput(input: SendEmailInput): NormalizedSendEmailInput | null {
  const to = normalizeEmailRecipients(input.to ?? '');
  const subject = input.subject?.trim();
  const html = input.html?.trim();
  const text = input.text?.trim();

  if (to.length === 0 || !subject || (!html && !text)) {
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
  normalized: NormalizedSendEmailInput,
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
      to: normalized.to.join(', '),
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
  normalized: NormalizedSendEmailInput,
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
        to: normalized.to.map((email) => ({
          email,
        })),
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

function sendMissingRecipientResult(): SendEmailResult {
  return {
    ok: false,
    provider: getResultProvider(),
    reason: 'missing_config',
    error: 'Email notification recipient not configured',
  };
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

export async function sendSupportTicketCreatedEmail({
  ticketId,
  userId,
  userName,
  userEmail,
  category,
  description,
  referenceId,
  referenceType,
  createdAt,
}: SupportTicketCreatedEmailInput): Promise<SendEmailResult> {
  const recipients = resolveNotificationRecipients('SUPPORT_EMAIL_TO');

  if (recipients.length === 0) {
    return sendMissingRecipientResult();
  }

  const template = buildAdminNotificationEmail({
    subject: '[Truth or Dare] Novo chamado de suporte',
    title: 'Novo chamado de suporte',
    fields: [
      { label: 'Ticket ID', value: ticketId },
      { label: 'Usuario ID', value: userId },
      { label: 'Usuario', value: userName },
      { label: 'Email do usuario', value: userEmail },
      { label: 'Categoria', value: category },
      { label: 'Descricao', value: description },
      { label: 'Referencia tipo', value: referenceType },
      { label: 'Referencia ID', value: referenceId },
      { label: 'Criado em UTC', value: createdAt.toISOString() },
    ],
  });

  return sendEmail({
    to: recipients.join(', '),
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendModerationReportCreatedEmail({
  reportId,
  reportType,
  reporterId,
  reporterName,
  reporterEmail,
  targetType,
  targetId,
  reason,
  details,
  clubId,
  createdAt,
}: ModerationReportCreatedEmailInput): Promise<SendEmailResult> {
  const recipients = resolveNotificationRecipients(
    'MODERATION_EMAIL_TO',
    'SUPPORT_EMAIL_TO',
  );

  if (recipients.length === 0) {
    return sendMissingRecipientResult();
  }

  const fields: AdminNotificationField[] = [
    { label: 'Denuncia ID', value: reportId },
    { label: 'Tipo de denuncia', value: reportType },
    { label: 'Reporter ID', value: reporterId },
    { label: 'Reporter', value: reporterName },
    { label: 'Email do reporter', value: reporterEmail },
    { label: 'Alvo tipo', value: targetType },
    { label: 'Alvo ID', value: targetId },
    { label: 'Motivo', value: reason },
    { label: 'Detalhes', value: details },
    { label: 'Criado em UTC', value: createdAt.toISOString() },
  ];

  if (clubId) {
    fields.splice(5, 0, { label: 'Clube ID', value: clubId });
  }

  const template = buildAdminNotificationEmail({
    subject: `[Truth or Dare] Nova denuncia: ${reportType}`,
    title: `Nova denuncia: ${reportType}`,
    fields,
  });

  return sendEmail({
    to: recipients.join(', '),
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendAccountSecurityEmail({
  to,
  subject,
  title,
  body,
}: AccountSecurityEmailInput): Promise<SendEmailResult> {
  const template = buildAccountSecurityEmail({
    subject,
    title,
    body,
  });

  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
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

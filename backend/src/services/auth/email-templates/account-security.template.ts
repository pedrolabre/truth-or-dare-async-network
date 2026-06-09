type AccountSecurityTemplateInput = {
  subject: string;
  title: string;
  body: string;
  happenedAt?: Date;
};

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateTime(value: Date): string {
  return value.toISOString().replace('T', ' ').replace('Z', ' UTC');
}

export function buildAccountSecurityEmail({
  subject,
  title,
  body,
  happenedAt = new Date(),
}: AccountSecurityTemplateInput): EmailTemplate {
  const formattedDate = formatDateTime(happenedAt);

  const text = [
    body,
    `Data e hora (UTC): ${formattedDate}.`,
    'Se voce nao fez esta alteracao, entre em contato com o suporte.',
  ].join('\n\n');

  const html = [
    '<div style="font-family: Arial, sans-serif; color: #111;">',
    `  <h2>${escapeHtml(title)}</h2>`,
    `  <p>${escapeHtml(body)}</p>`,
    `  <p>Data e hora (UTC): ${escapeHtml(formattedDate)}.</p>`,
    '  <p>Se voce nao fez esta alteracao, entre em contato com o suporte.</p>',
    '</div>',
  ].join('\n');

  return {
    subject,
    html,
    text,
  };
}

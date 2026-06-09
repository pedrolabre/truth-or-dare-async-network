type AdminNotificationTemplateInput = {
  subject: string;
  title: string;
  fields: Array<{
    label: string;
    value: string | null | undefined;
  }>;
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

function normalizeValue(value: string | null | undefined): string {
  const normalized = value?.trim();

  return normalized || '-';
}

export function buildAdminNotificationEmail({
  subject,
  title,
  fields,
}: AdminNotificationTemplateInput): EmailTemplate {
  const normalizedFields = fields.map((field) => ({
    label: field.label,
    value: normalizeValue(field.value),
  }));

  const text = [
    title,
    '',
    ...normalizedFields.map((field) => `${field.label}: ${field.value}`),
  ].join('\n');

  const html = [
    '<div style="font-family: Arial, sans-serif; color: #111;">',
    `  <h2>${escapeHtml(title)}</h2>`,
    '  <table style="border-collapse: collapse; width: 100%;">',
    ...normalizedFields.map(
      (field) =>
        [
          '    <tr>',
          `      <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${escapeHtml(field.label)}</td>`,
          `      <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(field.value)}</td>`,
          '    </tr>',
        ].join('\n'),
    ),
    '  </table>',
    '</div>',
  ].join('\n');

  return {
    subject,
    html,
    text,
  };
}

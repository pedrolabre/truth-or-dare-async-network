type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

function formatDateTime(value: Date): string {
  return value.toISOString().replace('T', ' ').replace('Z', ' UTC');
}

export function buildPasswordResetConfirmationEmail(): EmailTemplate {
  const subject = 'Senha redefinida com sucesso';
  const formattedDate = formatDateTime(new Date());

  const text = [
    'Sua senha foi alterada com sucesso.',
    `Data e hora (UTC): ${formattedDate}.`,
    'Se voce nao fez esta alteracao, entre em contato com o suporte.',
  ].join('\n\n');

  const html = [
    '<div style="font-family: Arial, sans-serif; color: #111;">',
    '  <h2>Senha redefinida com sucesso</h2>',
    '  <p>Sua senha foi alterada com sucesso.</p>',
    `  <p>Data e hora (UTC): ${formattedDate}.</p>`,
    '  <p>Se voce nao fez esta alteracao, entre em contato com o suporte.</p>',
    '</div>',
  ].join('\n');

  return {
    subject,
    html,
    text,
  };
}

type PasswordResetCodeTemplateInput = {
  code: string;
  expiresInMinutes: number;
};

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export function buildPasswordResetCodeEmail({
  code,
  expiresInMinutes,
}: PasswordResetCodeTemplateInput): EmailTemplate {
  const subject = 'Codigo de recuperacao de senha';

  const text = [
    'Voce solicitou a recuperacao de senha.',
    `Use o codigo abaixo para continuar: ${code}`,
    `Este codigo expira em ${expiresInMinutes} minutos.`,
    'Se voce nao solicitou esta acao, ignore este email.',
  ].join('\n\n');

  const html = [
    '<div style="font-family: Arial, sans-serif; color: #111;">',
    '  <h2>Codigo de recuperacao de senha</h2>',
    '  <p>Voce solicitou a recuperacao de senha.</p>',
    `  <p style="font-size: 20px; letter-spacing: 2px;"><strong>${code}</strong></p>`,
    `  <p>Este codigo expira em ${expiresInMinutes} minutos.</p>`,
    '  <p>Se voce nao solicitou esta acao, ignore este email.</p>',
    '</div>',
  ].join('\n');

  return {
    subject,
    html,
    text,
  };
}

import nodemailer from 'nodemailer';

async function main() {
  let transporter = nodemailer.createTransport({
    host: 'smtp.hostgator.com.br',
    port: 587,
    secure: true, // true para 465, false para outras portas
    auth: {
      user: 'workflow@inovaflowtec.com.br',
      pass: 'INF2026inf@wk', // sua senha SMTP
    },
  });

  let info = await transporter.sendMail({
    from: '"Juliana Nardaci" <workflow@inovaflowtec.com.br>',
    to: 'lucsilfreitas@gmail.com', // teste para gmail
    subject: 'Teste SMTP Hostgator via Node.js',
    text: 'Se você recebeu este e-mail, o SMTP está funcionando!',
  });

  console.log('Mensagem enviada: %s', info.messageId);
}

main().catch(console.error);
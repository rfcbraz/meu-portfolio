const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.FROM_EMAIL;
const toEmail = process.env.TO_EMAIL || 'filipebraz@rfcb.pt';

if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
  console.error('Missing SMTP configuration. Check .env file and required variables.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass
  }
});

app.use(express.json());

app.post('/api/contact', async (req, res) => {
  const { name, contact, subject, message } = req.body || {};

  if (!name || !contact || !subject || !message) {
    return res.status(400).json({ success: false, error: 'Missing required fields.' });
  }

  const replyTo = contact.includes('@') ? contact : undefined;
  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: `Novo contacto do site: ${subject}`,
    text: `Nome: ${name}\nContacto: ${contact}\nAssunto: ${subject}\n\nMensagem:\n${message}`,
    replyTo
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

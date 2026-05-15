const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
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

// simple request logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// enable CORS for development / same-origin requests
app.use(cors());

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
    const info = await transporter.sendMail(mailOptions);
    console.log('Contact email sent:', info.messageId || info.response || info);
    res.json({ success: true, info });
  } catch (error) {
    console.error('Error sending contact email:', error && error.stack ? error.stack : error);
    res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
});

// health endpoint for monitoring
app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// verify transporter and start server
transporter.verify().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log('SMTP transporter verified and ready to send emails.');
  });
}).catch(err => {
  console.error('SMTP transporter verification failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});

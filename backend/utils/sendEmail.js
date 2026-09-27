// backend/utils/sendEmail.js

import nodemailer from "nodemailer";

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("[EMAIL] SMTP credentials missing (EMAIL_USER / EMAIL_PASS).");
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });
  return cachedTransporter;
};

const sendEmail = async (options) => {
  const transporter = getTransporter();
  if (!transporter) {
    // Do NOT throw — email is non-critical.
    return null;
  }

  try {
    const mailOptions = {
      from: `"Spexxo" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[EMAIL] sent → ${options.email} | subject="${options.subject}" | id=${info.messageId}`,
    );
    return info;
  } catch (error) {
    // Never log credentials, tokens, or full SMTP config.
    console.error(
      `[EMAIL] failed → ${options.email} | subject="${options.subject}" | reason=${error.message}`,
    );
    return null;
  }
};

export default sendEmail;

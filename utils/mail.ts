import nodemailer from "nodemailer";
import 'dotenv/config';

const { GPASS } = process.env;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'thelogffb@gmail.com',
    pass: GPASS,
  }
});

async function sendMail(recipient: string, subject: string, message: string) {
  try {
    await transporter.sendMail({
      from: '"The Commish" <thelogffb@gmail.com>',
      to: recipient,
      subject,
      html: `<b>Message follows:</b> ${message}`,
    });
  } catch (err) {
    console.error('mail send failed', { recipient, subject, err });
    throw err;
  }
}

export default sendMail;

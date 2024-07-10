import nodemailer from "nodemailer";
import 'dotenv/config';

const {
  GPASS
} = process.env;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use false for STARTTLS; true for SSL on port 465
  auth: {
    user: 'thelogffb@gmail.com',
    pass: GPASS,
  }
});

async function sendMail(recipient: string, subject: string, message: string) {
  await transporter.sendMail({
    from: '"The Commish" <thelogffb@gmail.com>', // sender address
    to: recipient,
    subject,
    html: `<b>Message follows:</b> ${message}`,
  }).then(info => {
    console.log("Message sent.");
    console.dir(info);
  }).catch(console.error)
}

export default sendMail;

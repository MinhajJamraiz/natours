const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

const logger = require('./../logger');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Natours Family <${process.env.EMAIL_FROM}>`;
  }
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: process.env.SMTP_SERVICE,

        auth: {
          user: process.env.SMTP_LOGIN,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      //ACTIVATE "less secure account" in gmail
    });
  }
  async send(template, subject) {
    //1> Render HTML based pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      { firstName: this.firstName, url: this.url, subject },
    );

    //2>Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
      // html
    };
    //3>Create a transport and send email
    logger.info('Just before mail sending.');
    await this.newTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Application');
  }
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token(valid for only 10 minutes)',
    );
  }
};

// const sendEmail = async (options) => {
//   //1> Create the transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     //ACTIVATE "less secure account" in gmail
//   });
//   //2> Define the email options
//   const mailOptions = {
//     from: `Minhaj Jamraiz <${process.env.EMAIL_FROM}>`,
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html
//   };

//   //3> Actually send the email.
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
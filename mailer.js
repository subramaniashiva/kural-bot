require('dotenv').config();
const mailer = require('nodemailer');
const APP_CONSTANTS = require('./utils/constants');

// Mailer configuration
const transporter = mailer.createTransport({
  host: APP_CONSTANTS.mailConfig.host,
  port: APP_CONSTANTS.mailConfig.port,
  secure: true,
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSKEY
  }
});

// Mail template
let mailTemplate = {
  from: APP_CONSTANTS.mailDetails.from,
  to: APP_CONSTANTS.mailDetails.to,
  subject: APP_CONSTANTS.mailDetails.subject,
  html: APP_CONSTANTS.mailDetails.html
}

// Function to send mail
const sendMail = function sendMail(data) {
  let mail = Object.assign({}, mailTemplate);
  mail.html = (data ? data : '');
  transporter.sendMail(mail, function(error, response) {
    if(error) {
      console.log('error from sending mail ', error);
    }
    console.log('message sent: ', response.messageId, response.response);
  });
};

module.exports = {
  sendMail
}
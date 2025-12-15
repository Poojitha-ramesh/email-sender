// src/sendEmails.js
require("dotenv").config();
const fs = require("fs");
const csv = require("csv-parser");
const nodemailer = require("nodemailer");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Apps Script URL for form submissions
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxC6OoU_toxiYUghe5-bN3A39TGfdh5mtBOpuNHqWBKaA0n7DHu4hs6KJIxgjbg74_D/exec";

// AMP HTML template for interactive emails
function getAmpHtml() {
  return `
<!doctype html>
<html ⚡4email>
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-form"
          src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
  <style amp-custom>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    .container { padding: 20px; background: #f5f5f5; }
    .box { padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h3 { color: #333; margin-top: 0; }
    .button-link { display: inline-block; padding: 12px 30px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    input { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    button { padding: 12px; background: #4285f4; color: white; border: none; border-radius: 4px; width: 100%; cursor: pointer; font-weight: bold; }
    button:hover { background: #3367d6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="box">
      <h3>📋 Please Fill Out This Form</h3>
      <p>Click the button below to open and fill the form:</p>
      <a href="${APPS_SCRIPT_URL}" class="button-link">📝 Open Form</a>
      
      <hr>
      
      <p><strong>Or fill below (Gmail only):</strong></p>
      <form method="post" action-xhr="${APPS_SCRIPT_URL}" target="_top">
        <input type="text" name="name" placeholder="Your Name" required>
        <input type="email" name="email" placeholder="Your Email" required>
        <button type="submit">Submit</button>
        <div submit-success>
          <template type="amp-mustache">
            <p style="color:green;">✅ Thank you! Your submission was received.</p>
          </template>
        </div>
        <div submit-error>
          <template type="amp-mustache">
            <p style="color:red;">❌ Submission failed. Please try again.</p>
          </template>
        </div>
      </form>
    </div>
  </div>
</body>
</html>
`;
}

// 1. Configure the mail transporter (example: Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// 2. Function to send one email with AMP HTML
async function sendMail(to, subject = "Please Fill Out This Form", text = "") {
  const ampHtml = getAmpHtml();
  
  const htmlFallback = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .content { padding: 20px; background: white; border: 1px solid #ddd; border-radius: 8px; }
    .button { display: inline-block; padding: 12px 30px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 15px 0; }
    .button:hover { background: #3367d6; }
    .link { word-break: break-all; color: #0066cc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin-top: 0;">📋 Please Fill Out This Form</h2>
      <p>${text || 'We kindly request you to fill out the form by clicking the link below.'}</p>
    </div>
    
    <div class="content">
      <h3>🔗 Open Form</h3>
      <p><a href="${APPS_SCRIPT_URL}" class="button">Click Here to Open Form</a></p>
      
      <hr style="margin: 30px 0;">
      
      <h3>📋 Or Copy & Paste This Link</h3>
      <p class="link">${APPS_SCRIPT_URL}</p>
      
      <hr style="margin: 30px 0;">
      
      <p style="font-size: 12px; color: #666;">
        If the button above doesn't work, copy the link above and paste it in your browser address bar.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject,
    text: `Please fill out this form. Open this link: ${APPS_SCRIPT_URL}`,
    html: htmlFallback,
    alternatives: [
      {
        contentType: "text/x-amp-html",
        content: ampHtml,
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to: ${to}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed for ${to}:`, err.message);
    return false;
  }
}

// 3. Read CSV and send emails
function sendMailsFromCSV(csvPath) {
  const recipients = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => {
      if (row.email) {
        recipients.push(row.email.trim());
      }
    })
    .on("end", async () => {
      console.log(`Found ${recipients.length} emails in CSV`);

      const subject = "Please Fill Out This Form";
      const text = "We request you to fill out the form below. You can interact with it directly in Gmail.";

      for (const email of recipients) {
        await sendMail(email, subject, text);
      }

      console.log("🎉 All interactive AMP emails sent successfully!");
    })
    .on("error", (err) => {
      console.error("Error reading CSV:", err);
    });
}

// Export function for API use
async function sendEmailsWithBody(formUrl, emailBody) {
  const csvPath = "emails.csv";
  const recipients = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        if (row.email) {
          recipients.push(row.email.trim());
        }
      })
      .on("end", async () => {
        console.log(`Found ${recipients.length} emails in CSV`);

        const subject = "Please fill this short form";

        for (const email of recipients) {
          const body = emailBody + `\n\n${formUrl}`;
          await sendMail(email, subject, body);
        }

        console.log("🎉 Done sending all emails");
        resolve({ success: true, count: recipients.length });
      })
      .on("error", (err) => {
        console.error("Error reading CSV:", err);
        reject(err);
      });
  });
}



module.exports = { sendEmailsWithBody, sendMail };

// Run when file is executed directly
if (require.main === module) {
  sendMailsFromCSV("emails.csv");
}

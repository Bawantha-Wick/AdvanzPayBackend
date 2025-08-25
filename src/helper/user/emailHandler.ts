import * as mailJet from 'node-mailjet';
import config from '../../config';

const mailjet = (mailJet as any).apiConnect(
  '9596748d162ae6f3d956aeb7260a674d',
  /*process.env.MJ_APIKEY_PUBLIC as string, process.env.MJ_APIKEY_PRIVATE as string*/
  'eb8524b56f23dfbb24deb22d83f8704f'
);

interface EmailContent {
  subject: string;
  html: string;
}

const buildSupportTemplate = (payload: { subject: string; requestId: string; corporateName: string; priority: string; message: string; from?: string }) => {
  const { subject, requestId, corporateName, priority, message, from } = payload;
  const priorityColor = priority === 'High' ? '#e74c3c' : priority === 'Medium' ? '#f39c12' : '#2ecc71';

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AdvanzPay Support Request</title>
      <style>
          /* Base styles for email client compatibility */
          body, table, td, div, p, a {
              font-family: 'Inter', Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
              line-height: 1.6;
          }

          body {
              background-color: #F8F4F0; /* Aligns with the dashboard's light background */
              padding: 20px;
          }

          /* Email main container */
          .email-container {
              max-width: 600px;
              margin: 0 auto;
              border-spacing: 0;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
              border-radius: 12px;
              overflow: hidden;
              background-color: #ffffff; /* Aligns with the dashboard's card background */
          }

          /* Header with logo and title */
          .header {
              background-color: #E26E51; /* Primary brand color from the dashboard sidebar */
              padding: 24px 28px;
              text-align: center;
          }
          .header img {
              height: 36px;
              border: 0;
          }
          .header h1 {
              color: #ffffff;
              font-size: 24px;
              margin: 0;
              font-weight: 600;
              margin-top: 12px;
          }

          /* Main content area */
          .content {
              padding: 28px;
          }
          .content h2 {
              font-size: 18px;
              font-weight: 600;
              color: #555; /* Neutral dark gray for headings */
              margin-bottom: 20px;
          }

          /* Key details section */
          .details-section {
              border: 1px solid #f0f0f0;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 24px;
              background-color: #fafafa;
          }
          .detail-row {
              margin-bottom: 10px;
              color: #555;
          }
          .detail-row:last-child {
              margin-bottom: 0;
          }
          .detail-row strong {
              color: #333;
              display: inline-block;
              min-width: 120px;
          }

          .priority-pill {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              white-space: nowrap;
          }
          /* Priority colors are updated to be more vibrant on the light background */
          .priority-low { background-color: #d8f5e3; color: #1e8449; }
          .priority-medium { background-color: #fff8e3; color: #f39c12; }
          .priority-high { background-color: #ffe0e0; color: #c0392b; }
          .priority-urgent { background-color: #c0392b; color: #ffffff; }

          /* Message body section */
          .message-body {
              background-color: #ffffff;
              border-radius: 8px;
              border: 1px solid #e0e0e0;
              padding: 20px;
              white-space: pre-wrap;
          }

          /* Footer */
          .footer {
              background-color: #f0f2f5;
              padding: 20px 28px;
              font-size: 12px;
              color: #888;
              text-align: center;
          }
      </style>
  </head>
  <body>
      <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0">
          <!-- Header -->
          <tr>
              <td align="center" class="header">
                  <img src="https://placehold.co/150x36/E26E51/ffffff?text=ADVANZPAY" alt="AdvanzPay Logo">
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 600; margin-top: 12px;">Support Request</h1>
              </td>
          </tr>
          <!-- Main Content -->
          <tr>
              <td class="content">
                  <h2 style="font-size: 18px; font-weight: 600; color: #555; margin-bottom: 20px;">Details for Request #${requestId}</h2>

                  <!-- Key Details -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="details-section">
                      <tr>
                          <td style="padding: 20px;">
                              <div class="detail-row">
                                  <strong>Corporate Name:</strong> ${corporateName}
                              </div>
                              <div class="detail-row">
                                  <strong>Subject:</strong> ${subject}
                              </div>
                              <div class="detail-row">
                                  <strong>From:</strong> Anonymous
                              </div>
                              <div class="detail-row">
                                  <strong>Priority:</strong>
                                  <span class="priority-pill priority-high" style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">${priority}</span>
                              </div>
                          </td>
                      </tr>
                  </table>

                  <!-- Message Body -->
                  <p style="font-weight: 600; color: #555; margin: 0 0 12px;">Message:</p>
                  <div class="message-body">
                      <p>${message}</p>
                  </div>
              </td>
          </tr>
          <!-- Footer -->
          <tr>
              <td align="center" class="footer">
                  <p style="margin: 0 0 5px;">This email was sent automatically by the AdvanzPay support system. For inquiries, please contact our support team.</p>
                  <p style="font-size: 10px; color: #999; margin: 0;">Please do not reply directly to this email.</p>
              </td>
          </tr>
      </table>
  </body>
  </html>

  `;

  return {
    subject: `Support: ${subject} [${priority}]`,
    html
  } as EmailContent;
};

export const sendEmail = async (to: string, data: any, templateTag: string) => {
  try {
    let emailContent: EmailContent;

    if (templateTag === 'support') {
      // data expected: { subject, priority, message, from }
      emailContent = buildSupportTemplate(data);
    } else {
      // fallback: simple email
      emailContent = {
        subject: data.subject || 'No subject',
        html: data.html || `<pre>${JSON.stringify(data, null, 2)}</pre>`
      };
    }

    // const transporter = nodemailer.createTransport({
    //   host: 'smtp.gmail.com',
    //   port: 465,
    //   secure: true,
    //   auth: {
    //     user: 'hello@quirk.money',
    //     pass: 'vpqknctwxrxtnqto'
    //   },
    //   tls: {
    //     rejectUnauthorized: false //unathoutized access allow
    console.log('to: ', to);
    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: 'bawanthan+mailjet@zillione.com', //data.from || config.MAIL_USER || `no-reply@${config.HOST || 'advanzpay.local'}`,
            Name: 'AdvanzPay'
          },
          To: [
            {
              Email: 'xajof85419@ahanim.com',
              Name: to
            }
          ],
          Subject: emailContent.subject,
          HTMLPart: emailContent.html
        }
      ]
    });

    await request
      .then((result) => {
        console.log(result.body);
      })
      .catch((err) => {
        console.log(err.statusCode);
      });

    const mailOptions = {
      from: data.from || config.MAIL_USER || `no-reply@${config.HOST || 'advanzpay.local'}`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    // console.info('Email sent:', info && info.messageId ? info.messageId : info);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

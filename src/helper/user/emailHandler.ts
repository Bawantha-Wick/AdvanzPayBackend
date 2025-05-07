import config from '../../config';
import { User } from '../../entity/User';

interface EmailContent {
  subject: string;
  html: string;
}

export const sendEmail = async (to: string, data: object, templateTag: string) => {
  try {
    let emailContent: EmailContent;

    const subject = emailContent.subject;
    const html = emailContent.html;

    // send email using mailjet
  } catch (error) {
    console.error(error);
  }
};

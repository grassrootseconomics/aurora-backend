import emailTransport from '@/plugins/emailTransport';

import { EmailParameters } from '@/utils/types/association/EmailParameters';

export const sendBatchRequestEmails = (
    userEmails: string[],
    { country, city, name, contactNumber, email, message }: EmailParameters,
    batchCode: string
) => {
    const subject = `New Batch ${batchCode} Request`;
    const content = `<div style="background:#964514; padding: 60px 30px">
    <h2 style="color: #fff; font-size: 32px; margin-top: 0"> Batch Request </h2>
    <p style="color: #fff; font-size: 18px;">
        New request for cacao batch ${batchCode} from a user on the Aurora Platform:
        <br>
        <div style="width: 50%;color: white;padding: 5px;background-color: #75360f;">
            <i>"${message ?? ''}"</i>
        </div>
        <br>
            <p style="color:white;"><b>Name: </b>${name}</p>
        <br>
            <p style="color:white;"><b>Contact Number: </b>${contactNumber}</p>
        <br>
            <p style="color:white;"><b>Email: </b>${email}</p>
        <br>
            <p style="color:white;"><b>Country: </b>${country}</p>
        <br>
            <p style="color:white;"><b>City: </b>${city}</p>
    </p>
  </div>
  `;
    return sendEmail(userEmails, subject, content);
};

export const sendEmail = (
    receivers: string[],
    subject: string,
    content: string
) => {
    return emailTransport.sendMail({
        from: `"Aurora" no-reply@aurora.co`,
        to: receivers,
        subject,
        html: content,
    });
};

import { SMTP } from '@/config';
import nodemailer from 'nodemailer';

const emailTransport = nodemailer.createTransport({
    host: 'smtp-relay.sendinblue.com',
    port: 587,
    secure: false,
    auth: {
        user: SMTP.ACCOUNT,
        pass: SMTP.KEY,
    },
});

export default emailTransport;

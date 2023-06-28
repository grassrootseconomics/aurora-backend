import { SMTP } from '@/config';
import nodemailer from 'nodemailer';

const emailTransport = nodemailer.createTransport({
    host: SMTP.HOST,
    port: SMTP.PORT,
    secure: false,
    auth: {
        user: SMTP.ACCOUNT,
        pass: SMTP.KEY,
    },
});

export default emailTransport;

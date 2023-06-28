import dotenv from 'dotenv';

dotenv.config();

const CONNECTION_URL: string =
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/aurora-cacao?schema=public';

const PORT = process.env.PORT || '8080';

const REFRESH_TOKEN_SECRET: string =
    process.env.REFRESH_TOKEN_SECRET || 'refreshToken';
const ACCESS_TOKEN_SECRET: string =
    process.env.ACCESS_TOKEN_SECRET || 'accessToken';

const REFRESH_TOKEN_EXPIRE: number =
    parseInt(process.env.REFRESH_TOKEN_EXPIRE) || 2592000;
const ACCESS_TOKEN_EXPIRE: number =
    parseInt(process.env.ACCESS_TOKEN_EXPIRE) || 1800;

const REFRESH_TOKEN__ISSUER: string =
    process.env.REFRESH_TOKEN__ISSUER || 'testIssuer';
const ACCESS_TOKEN_ISSUER: string =
    process.env.ACCESS_TOKEN_ISSUER || 'testIssuer';

const ODK_API_URL: string = process.env.ODK_API_URL || '';
const ODK_PROJECT_ID: string = process.env.ODK_PROJECT_ID || '';

const SMTP_KEY: string = process.env.SMTP_KEY || undefined;
const SMTP_ACCOUNT: string = process.env.SMTP_ACCOUNT || undefined;
const SMTP_PORT: string = process.env.SMTP_PORT || undefined;
const SMTP_HOST: string = process.env.SMTP_HOST || undefined;

const DB = {
    CONNECTION_URL,
};

const SMTP = {
    PORT: isNaN(parseInt(SMTP_PORT)) ? undefined : parseInt(SMTP_PORT),
    HOST: SMTP_HOST,
    KEY: SMTP_KEY,
    ACCOUNT: SMTP_ACCOUNT,
};

const SERVER = {
    PORT,
    ACCESS_TOKEN: {
        SECRET: ACCESS_TOKEN_SECRET,
        EXPIRE_TIME: ACCESS_TOKEN_EXPIRE,
        ISSUER: ACCESS_TOKEN_ISSUER,
    },
    REFRESH_TOKEN: {
        SECRET: REFRESH_TOKEN_SECRET,
        EXPIRE_TIME: REFRESH_TOKEN_EXPIRE,
        ISSUER: REFRESH_TOKEN__ISSUER,
    },
};

const ODK = {
    API_URL: ODK_API_URL,
    PROJECT_ID: ODK_PROJECT_ID,
};

export { SERVER, DB, SMTP, ODK };

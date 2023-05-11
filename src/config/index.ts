import dotenv from 'dotenv';

dotenv.config();

const CONNECTION_URL: string =
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/aurora-cacao?schema=public';

const PORT = process.env.PORT || '8080';

const DB = {
    CONNECTION_URL,
};

const SERVER = {
    PORT,
};

export { SERVER, DB };

import express from 'express';

import { ODK, SERVER } from '@/config';
import cors from 'cors';
import cron from 'node-cron';

import v1 from '@/routes/v1';

import { errorHandler } from '@/middleware/handlers/errorHandler';

import ApiError from '@/utils/types/errors/ApiError';

import { syncODKForms } from './db/synkODK';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/v1', v1);

// send back a 404 error for any unknown api request
app.use((_, __, next) => {
    next(new ApiError(404, 'Route does not exist!'));
});

app.use(errorHandler);

app.listen(SERVER.PORT, () => {
    console.log(`Application started on port ${SERVER.PORT}!`);
});

/**
 * Configured to run every hour.
 */
cron.schedule(ODK.SYNC_CRON.STR, async () => {
    try {
        await syncODKForms();
    } catch (err) {
        console.log(err);
    }
});

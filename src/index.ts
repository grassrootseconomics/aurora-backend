import express from 'express';

import { SERVER } from '@/config';

import v1 from '@/routes/v1';

import { errorHandler } from '@/middleware/handlers/errorHandler';

import ApiError from '@/utils/types/errors/ApiError';

const app = express();

app.use(express.json());

app.use('/v1', v1);

// send back a 404 error for any unknown api request
app.use((_, __, next) => {
    next(new ApiError(404, 'Route does not exist!'));
});

app.use(errorHandler);

app.listen(SERVER.PORT, () => {
    console.log(`Application started on port ${SERVER.PORT}!`);
});

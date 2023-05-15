import express from 'express';

import { SERVER } from '@/config';

import v1 from '@/routes/v1';

const app = express();

app.use(express.json());

app.use('/v1', v1);

app.listen(SERVER.PORT, () => {
    console.log(`Application started on port ${SERVER.PORT}!`);
});

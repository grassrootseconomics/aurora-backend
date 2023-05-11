import express from 'express';
import v1 from './routes/v1';
import { SERVER } from './config';

const app = express();

app.use(express.json());

app.use('/v1', v1);

app.listen(SERVER.PORT, () => {
    console.log(`Application started on port ${SERVER.PORT}!`);
});

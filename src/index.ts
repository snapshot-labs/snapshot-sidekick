import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import rpc from './rpc';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ maxAge: 86400 }));
app.use(compression());
app.use('/', rpc);

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));

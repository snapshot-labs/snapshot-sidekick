import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import api from './api';
import log from './helpers/log';
import './lib/queue';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '4mb' }));
app.use(cors({ maxAge: 86400 }));
app.use(compression());
app.use('/', api);

app.listen(PORT, () => log.info(`[http] Start server at http://localhost:${PORT}`));

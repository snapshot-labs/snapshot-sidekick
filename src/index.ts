import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import api from './api';
import webhook from './webhook';
import log from './helpers/log';
import './lib/queue';
import { name, version } from '../package.json';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json({ limit: '4mb' }));
app.use(cors({ maxAge: 86400 }));
app.use(compression());
app.use('/api', api);
app.use('/', webhook);

app.get('/', (req, res) => {
  const commit = process.env.COMMIT_HASH || '';
  const v = commit ? `${version}#${commit.substring(0, 7)}` : version;
  return res.json({
    name,
    version: v
  });
});

app.listen(PORT, () => log.info(`[http] Start server at http://localhost:${PORT}`));

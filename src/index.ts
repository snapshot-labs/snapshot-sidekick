import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { initLogger, fallbackLogger } from '@snapshot-labs/snapshot-sentry';
import api from './api';
import webhook from './webhook';
import sentryTunnel from './sentryTunnel';
import './lib/queue';
import { name, version } from '../package.json';
import { rpcError } from './helpers/utils';
import initMetrics from './lib/metrics';

const app = express();
const PORT = process.env.PORT || 3005;

initLogger(app);
initMetrics(app);

app.disable('x-powered-by');
app.use(express.json({ limit: '4mb' }));
app.use(cors({ maxAge: 86400 }));
app.use(compression());
app.use('/api', api);
app.use('/', webhook);
app.use('/', sentryTunnel);

app.get('/', (req, res) => {
  const commit = process.env.COMMIT_HASH || '';
  const v = commit ? `${version}#${commit.substring(0, 7)}` : version;
  return res.json({
    name,
    version: v
  });
});

fallbackLogger(app);

app.use((_, res) => {
  rpcError(res, 'RECORD_NOT_FOUND', '');
});

app.listen(PORT, () => console.log(`[http] Start server at http://localhost:${PORT}`));

import express from 'express';
import { rpcError, rpcSuccess, storageEngine } from './helpers/utils';
import log from './helpers/log';
import { queues } from './lib/queue';
import { BadgeType, getBadge } from './lib/badge';
import { name, version } from '../package.json';
import VotesReport from './lib/votesReport';

const router = express.Router();

router.get('/', (req, res) => {
  const commit = process.env.COMMIT_HASH || '';
  const v = commit ? `${version}#${commit.substr(0, 7)}` : version;
  return res.json({
    name,
    version: v
  });
});

router.post('/votes/generate', async (req, res) => {
  log.info(`[http] POST /votes/generate`);

  const body = req.body || {};
  const event = body.event.toString();
  const id = body.id.toString().replace('proposal/', '');

  if (req.headers['authenticate'] !== process.env.WEBHOOK_AUTH_TOKEN?.toString()) {
    return rpcError(res, 'UNAUTHORIZED', id);
  }

  if (!event || !id) {
    return rpcError(res, 'Invalid Request', id);
  }

  if (event !== 'proposal/end') {
    return rpcSuccess(res, 'Event skipped', id);
  }

  try {
    await new VotesReport(id, storageEngine(process.env.VOTE_REPORT_SUBDIR)).canBeCached();
    queues.add(id);
    return rpcSuccess(res, 'Cache file generation queued', id);
  } catch (e) {
    log.error(e);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

router.post('/votes/:id', async (req, res) => {
  const { id } = req.params;
  log.info(`[http] POST /votes/${id}`);

  const votesReport = new VotesReport(id, storageEngine(process.env.VOTE_REPORT_SUBDIR));

  try {
    const file = await votesReport.cachedFile();

    if (typeof file === 'string') {
      res.header('Content-Type', 'text/csv');
      res.attachment(votesReport.filename);
      return res.send(Buffer.from(file));
    }

    try {
      await votesReport.canBeCached();
      queues.add(id);
      return rpcError(res, 'PENDING_GENERATION', id);
    } catch (e: any) {
      log.error(e);
      rpcError(res, e, id);
    }
  } catch (e) {
    log.error(e);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

router.get('/badges/:type(space|proposal)/:id', async (req, res) => {
  const { id, type } = req.params;

  try {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=18000, must-revalidate');
    return res.end(await getBadge(type as BadgeType, id, req.query));
  } catch (e) {
    log.error(e);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

export default router;

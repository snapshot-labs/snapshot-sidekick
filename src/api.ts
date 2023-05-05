import express from 'express';
import { rpcError, rpcSuccess, storageEngine } from './helpers/utils';
import log from './helpers/log';
import { queues } from './lib/queue';
import { name, version } from '../package.json';
import VotesReport from './lib/votesReport';
import ogImage from './lib/ogImage';
import type { ImageType } from './lib/ogImage';

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

    if (file instanceof Buffer) {
      res.header('Content-Type', 'text/csv');
      res.attachment(votesReport.filename);
      return res.end(file);
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

router.post('/og/refresh', async (req, res) => {
  log.info(`[http] POST /og/refresh`);

  const body = req.body || {};
  const event = body.event.toString();
  const { type, id } = body.id.toString().split('/');

  if (req.headers['authenticate'] !== process.env.WEBHOOK_AUTH_TOKEN?.toString()) {
    return rpcError(res, 'UNAUTHORIZED', id);
  }

  if (!event || !id) {
    return rpcError(res, 'Invalid Request', id);
  }

  if (type !== 'proposal') {
    return rpcSuccess(res, 'Event skipped', id);
  }

  try {
    const og = new ogImage(type as ImageType, id, storageEngine(process.env.OG_IMAGES_SUBDIR));
    await og.getImage(true);
    return rpcSuccess(res, `Image card for ${type} refreshed`, id);
  } catch (e) {
    log.error(e);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

router.get('/og/:type(space|proposal|home)/:id?.:ext(png|svg)?', async (req, res) => {
  const { type, id = '', ext = 'png' } = req.params;

  try {
    const og = new ogImage(type as ImageType, id, storageEngine(process.env.OG_IMAGES_SUBDIR));

    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('Content-Type', `image/${ext === 'svg' ? 'svg+xml' : 'png'}`);
    return res.end(await (ext === 'svg' ? og.getSvg() : og.getImage()));
  } catch (e) {
    log.error(e);
    res.setHeader('Content-Type', 'application/json');
    return rpcError(res, 'INTERNAL_ERROR', id || type);
  }
});

export default router;

import express from 'express';
import { voteReportWithStorage, ogImageWithStorage, rpcError, rpcSuccess } from './helpers/utils';
import log from './helpers/log';
import { queues } from './lib/queue';
import { ImageType } from './lib/ogImage';

const router = express.Router();

router.post('/votes/generate', async (req, res) => {
  log.info(`[http] POST /votes/generate`);

  const body = req.body || {};
  const event = body.event.toString();
  const id = body.id.toString().replace('proposal/', '');

  if (req.headers['authenticate'] !== process.env.WEBHOOK_AUTH_TOKEN?.toString()) {
    return rpcError(res, 'UNAUTHORIZE', id);
  }

  if (!event || !id) {
    return rpcError(res, 'Invalid Request', id);
  }

  if (event !== 'proposal/end') {
    return rpcSuccess(res, 'Event skipped', id);
  }

  try {
    await voteReportWithStorage(id).canBeCached();
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

  const votesReport = voteReportWithStorage(id);

  try {
    const file = await votesReport.cachedFile();

    if (file instanceof Buffer) {
      res.header('Content-Type', 'text/csv');
      res.attachment(votesReport.filename);
      return res.end(file);
    }

    votesReport
      .canBeCached()
      .then(() => {
        queues.add(id);
        return rpcError(res, 'PENDING_GENERATION', id);
      })
      .catch((e: any) => {
        log.error(e);
        rpcError(res, e, id);
      });
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
    return rpcError(res, 'UNAUTHORIZE', id);
  }

  if (!event || !id) {
    return rpcError(res, 'Invalid Request', id);
  }

  if (type !== 'proposal') {
    return rpcSuccess(res, 'Event skipped', id);
  }

  try {
    const og = ogImageWithStorage(type as ImageType, id);
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
    const og = ogImageWithStorage(type as ImageType, id);

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

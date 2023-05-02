import express from 'express';
import { voteReportWithStorage, rpcError, rpcSuccess } from './helpers/utils';
import log from './helpers/log';
import { queues } from './lib/queue';
import { BadgeType, getBadge } from './lib/badge';

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

    if (typeof file === 'string') {
      res.header('Content-Type', 'text/csv');
      res.attachment(votesReport.filename);
      return res.send(Buffer.from(file));
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

router.get('/badges/:type(space|proposal)/:id.:ext(png|svg)?', async (req, res) => {
  const { id, type, ext = 'svg' } = req.params;

  try {
    res.setHeader('Content-Type', `image/${ext === 'svg' ? 'svg+xml' : 'png'}`);
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.end(await getBadge(type as BadgeType, id, ext, req.query));
  } catch (e) {
    log.error(e);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

export default router;

import express from 'express';
import { rpcError, rpcSuccess, storageEngine } from './helpers/utils';
import getModerationList from './lib/moderationList';
import VotesReport from './lib/votesReport';
import ogImage from './lib/ogImage';
import type { ImageType } from './lib/ogImage';
import { signDeploy, signMint } from './lib/nftClaimer';
import { queue, getProgress } from './lib/queue';

const router = express.Router();

router.post('/votes/:id', async (req, res) => {
  const { id } = req.params;
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
      queue(id);
      return rpcSuccess(res.status(202), getProgress(id).toString(), id);
    } catch (e: any) {
      console.error(e);
      rpcError(res, e, id);
    }
  } catch (e) {
    console.error(e);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

router.post('/og/refresh', async (req, res) => {
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
    console.error(e);
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
    console.error(e);
    res.setHeader('Content-Type', 'application/json');
    return rpcError(res, 'INTERNAL_ERROR', id || type);
  }
});

router.get('/moderation', async (req, res) => {
  const { list } = req.query;

  try {
    res.json(await getModerationList(list ? (list as string).split(',') : undefined));
  } catch (e) {
    console.error(e);
    return rpcError(res, 'INTERNAL_ERROR', '');
  }
});

router.post('/nft-claimer/:type(deploy|mint)/sign', async (req, res) => {
  try {
    const { address, id, salt } = req.body;
    switch (req.params.type) {
      case 'deploy':
        return res.json(await signDeploy(address, id, salt));
      case 'mint':
        return res.json(await signMint(address, id, salt));
      default:
        throw new Error('Invalid Request');
    }
  } catch (e: any) {
    console.error(e);
    return rpcError(res, e, '');
  }
});

export default router;

import express from 'express';
import { rpcError, rpcSuccess, storageEngine } from './helpers/utils';
import VotesReport from './lib/votesReport';
import { queues } from './lib/queue';

const router = express.Router();

router.post('/webhook', async (req, res) => {
  const body = req.body || {};
  const event = body.event.toString();
  const id = body.id.toString().replace('proposal/', '');

  if (req.headers['Authentication'] !== process.env.WEBHOOK_AUTH_TOKEN?.toString()) {
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
    console.error(e);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

export default router;

import express from 'express';
import { rpcError, rpcSuccess, storageEngine } from './helpers/utils';
import { capture } from '@snapshot-labs/snapshot-sentry';
import VotesReport from './lib/votesReport';
import picSnap from './lib/picSnap';
import { queue } from './lib/queue';

const router = express.Router();

function processVotesReport(id: string, event: string) {
  if (event == 'proposal/end') {
    queue(new VotesReport(id, storageEngine(process.env.VOTE_REPORT_SUBDIR)));
  }
}

function processPicSnapRefresh(id: string, type: string) {
  if (type === 'proposal') {
    queue(new picSnap('og-proposal', id, storageEngine(process.env.PICSNAP_SUBDIR)));
  }
}

router.post('/webhook', (req, res) => {
  const body = req.body || {};
  const event = body.event?.toString() ?? '';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, id } = body.id?.toString().split('/');

  if (req.headers['authentication'] !== `${process.env.WEBHOOK_AUTH_TOKEN ?? ''}`) {
    return rpcError(res, 'UNAUTHORIZED', id);
  }

  if (!event || !id) {
    return rpcError(res, 'Invalid Request', id);
  }

  try {
    processVotesReport(id, event);
    processPicSnapRefresh(id, type);

    return rpcSuccess(res, 'Webhook received', id);
  } catch (e) {
    capture(e, { body });
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

export default router;

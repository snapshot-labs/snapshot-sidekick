import express from 'express';
import { rpcError, rpcSuccess, storageEngine } from './helpers/utils';
import { capture } from '@snapshot-labs/snapshot-sentry';
import VotesReport from './lib/votesReport';
import Summary from './lib/ai/summary';
import TextToSpeech from './lib/ai/textToSpeech';
import { queue } from './lib/queue';

const router = express.Router();

function processEvent(id: string, event: string) {
  if (event == 'proposal/end') {
    queue(new VotesReport(id, storageEngine(process.env.VOTE_REPORT_SUBDIR)));
  }

  if (event === 'proposal/start') {
    queue(new Summary(id, storageEngine(process.env.VOTE_REPORT_SUBDIR)));
    queue(new TextToSpeech(id, storageEngine(process.env.VOTE_REPORT_SUBDIR)));
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
    processEvent(id, event);
    return rpcSuccess(res, 'Webhook received', id);
  } catch (e) {
    capture(e, { body });
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

export default router;

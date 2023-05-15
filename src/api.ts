import express from 'express';
import log from './helpers/log';
import { rpcError, storageEngine } from './helpers/utils';
import getModerationList from './lib/moderationList';
import VotesReport from './lib/votesReport';
import { signSpaceOwner, signValidProposal } from './lib/nftClaimer';
import { queues } from './lib/queue';

const router = express.Router();

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

router.get('/moderationList', async (req, res) => {
  const { fields } = req.query;

  try {
    res.json(getModerationList(fields ? (fields as string).split(',') : undefined));
  } catch (e) {
    log.error(e);
    return rpcError(res, 'INTERNAL_ERROR', '');
  }
});

router.post('/sign', async (req, res) => {
  try {
    const { type, address, id, salt } = req.body;
    switch (type) {
      case 'space':
        return res.send(await signSpaceOwner(address, id, salt));
      case 'proposal':
        return res.send(await signValidProposal(address, id, salt));
      default:
        throw new Error('Invalid Request');
    }
  } catch (e: any) {
    return rpcError(res, e, '');
  }
});

export default router;

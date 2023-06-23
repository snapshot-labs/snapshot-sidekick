import express from 'express';
import { rpcError, rpcSuccess, storageEngine } from './helpers/utils';
import getModerationList from './lib/moderationList';
import VotesReport from './lib/votesReport';
import mintPayload from './lib/nftClaimer/mint';
import deployPayload from './lib/nftClaimer/deploy';
import { queue, getProgress } from './lib/queue';

const router = express.Router();

router.post('/votes/:id', async (req, res) => {
  const { id } = req.params;
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

router.get('/moderation', async (req, res) => {
  const { list } = req.query;

  try {
    res.json(await getModerationList(list ? (list as string).split(',') : undefined));
  } catch (e) {
    console.error(e);
    return rpcError(res, 'INTERNAL_ERROR', '');
  }
});

router.post('/nft-claimer/deploy', async (req, res) => {
  const { address, id, salt, maxSupply, mintPrice, spaceTreasury, proposerFee } = req.body;
  try {
    return res.json(
      await deployPayload(address, id, maxSupply, mintPrice, proposerFee, salt, spaceTreasury)
    );
  } catch (e: any) {
    console.error(e);
    return rpcError(res, e, salt);
  }
});

router.post('/nft-claimer/mint', async (req, res) => {
  const { proposalAuthor, address, id, salt } = req.body;
  try {
    return res.json(await mintPayload(proposalAuthor, address, id, salt));
  } catch (e: any) {
    console.error(e);
    return rpcError(res, e, salt);
  }
});

export default router;

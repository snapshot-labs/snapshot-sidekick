import express from 'express';
import { capture } from './helpers/sentry';
import { rpcError, rpcSuccess, storageEngine } from './helpers/utils';
import getModerationList from './lib/moderationList';
import VotesReport from './lib/votesReport';
import mintPayload from './lib/nftClaimer/mint';
import deployPayload from './lib/nftClaimer/deploy';
import { queue, getProgress } from './lib/queue';
import { snapshotFee } from './lib/nftClaimer/utils';

const router = express.Router();

router.post('/votes/:id', async (req, res) => {
  const { id } = req.params;
  const votesReport = new VotesReport(id, storageEngine(process.env.VOTE_REPORT_SUBDIR));

  try {
    const file = await votesReport.getCache();

    if (typeof file === 'string') {
      res.header('Content-Type', 'text/csv');
      res.attachment(votesReport.filename);
      return res.end(file);
    }

    try {
      await votesReport.isCacheable();
      queue(votesReport);
      return rpcSuccess(res.status(202), getProgress(id).toString(), id);
    } catch (e: any) {
      capture(e);
      rpcError(res, e, id);
    }
  } catch (e) {
    capture(e);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

router.get('/moderation', async (req, res) => {
  const { list } = req.query;

  try {
    res.json(await getModerationList(list ? (list as string).split(',') : undefined));
  } catch (e) {
    capture(e);
    return rpcError(res, 'INTERNAL_ERROR', '');
  }
});

router.get('/nft-claimer', async (req, res) => {
  try {
    return res.json({ snapshotFee: await snapshotFee() });
  } catch (e: any) {
    console.error(e);
    return rpcError(res, e, '');
  }
});

router.post('/nft-claimer/deploy', async (req, res) => {
  const { address, id, salt, maxSupply, mintPrice, spaceTreasury, proposerFee } = req.body;
  try {
    return res.json(
      await deployPayload({
        spaceOwner: address,
        id,
        maxSupply,
        mintPrice,
        proposerFee,
        salt,
        spaceTreasury
      })
    );
  } catch (e: any) {
    capture(e);
    return rpcError(res, e, salt);
  }
});

router.post('/nft-claimer/mint', async (req, res) => {
  const { proposalAuthor, address, id, salt } = req.body;
  try {
    return res.json(await mintPayload({ proposalAuthor, recipient: address, id, salt }));
  } catch (e: any) {
    capture(e);
    return rpcError(res, e, salt);
  }
});

export default router;

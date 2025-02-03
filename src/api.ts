import express from 'express';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { rpcError, rpcSuccess, storageEngine } from './helpers/utils';
import getModerationList from './lib/moderationList';
import VotesReport from './lib/votesReport';
import mintPayload from './lib/nftClaimer/mint';
import deployPayload from './lib/nftClaimer/deploy';
import { queue, getProgress } from './lib/queue';
import { snapshotFee } from './lib/nftClaimer/utils';
import AiSummary from './lib/ai/summary';
import AiTextToSpeech from './lib/ai/textToSpeech';
import { getDomain } from './lib/domain';

const router = express.Router();

router.all('/votes/:id', async (req, res) => {
  const { id } = req.params;
  const votesReport = new VotesReport(id, storageEngine(process.env.VOTE_REPORT_SUBDIR));

  try {
    const file = await votesReport.getCache();

    if (file) {
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

router.post('/ai/summary/:id', async (req, res) => {
  const { id } = req.params;
  const aiSummary = new AiSummary(id, storageEngine(process.env.AI_SUMMARY_SUBDIR));

  try {
    const cachedSummary = await aiSummary.getCache();

    let summary = '';

    if (!cachedSummary) {
      summary = (await aiSummary.createCache()).toString();
    } else {
      summary = cachedSummary.toString();
    }

    return rpcSuccess(res.status(200), summary, id);
  } catch (e: any) {
    capture(e);
    return rpcError(res, e.message || 'INTERNAL_ERROR', id);
  }
});

router.post('/ai/tts/:id', async (req, res) => {
  const { id } = req.params;
  const aiTextTpSpeech = new AiTextToSpeech(id, storageEngine(process.env.AI_TTS_SUBDIR));

  try {
    const cachedAudio = await aiTextTpSpeech.getCache();

    let audio: Buffer;

    if (!cachedAudio) {
      try {
        audio = (await aiTextTpSpeech.createCache()) as Buffer;
      } catch (e: any) {
        capture(e);
        return rpcError(res, e, id);
      }
    } else {
      audio = cachedAudio as Buffer;
    }

    res.header('Content-Type', 'audio/mpeg');
    res.attachment(aiTextTpSpeech.filename);
    return res.end(audio);
  } catch (e: any) {
    capture(e);
    return rpcError(res, e.message || 'INTERNAL_ERROR', id);
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

router.get('/domains/:domain', async (req, res) => {
  const { domain } = req.params;

  try {
    res.json({ domain, space_id: getDomain(domain) });
  } catch (e) {
    capture(e);
    return rpcError(res, 'INTERNAL_ERROR', '');
  }
});

router.get('/nft-claimer', async (req, res) => {
  try {
    return res.json({ snapshotFee: await snapshotFee() });
  } catch (e: any) {
    capture(e);
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
    capture(e, { body: req.body });
    return rpcError(res, e, salt);
  }
});

router.post('/nft-claimer/mint', async (req, res) => {
  const { proposalAuthor, address, id, salt } = req.body;
  try {
    return res.json(await mintPayload({ proposalAuthor, recipient: address, id, salt }));
  } catch (e: any) {
    capture(e, { body: req.body });
    return rpcError(res, e, salt);
  }
});

router.get('/proxy/:url', async (req, res) => {
  const { url } = req.params;

  try {
    const response = await fetch(url);

    return res.json(await response.json());
  } catch (e: any) {
    res.status(500).json({
      error: {
        code: 500,
        message: 'failed to fetch URL'
      }
    });
  }
});

export default router;

import { capture } from '@snapshot-labs/snapshot-sentry';
import express from 'express';
import { rpcError, rpcSuccess, storageEngine } from './helpers/utils';
import AiSummary from './lib/ai/summary';
import AiTextToSpeech from './lib/ai/textToSpeech';
import { getDomain } from './lib/domain';
import getModerationList from './lib/moderationList';
import deployPayload from './lib/nftClaimer/deploy';
import mintPayload from './lib/nftClaimer/mint';
import { snapshotFee } from './lib/nftClaimer/utils';
import { fetchPreview } from './lib/og';
import { getProgress, queue } from './lib/queue';
import VotesReport from './lib/votesReport';

const router = express.Router();

router.all('/votes/:id', async (req, res) => {
  const { id } = req.params;
  const votesReport = new VotesReport(
    id,
    storageEngine(process.env.VOTE_REPORT_SUBDIR)
  );

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
    } catch (err: any) {
      capture(err);
      rpcError(res, err, id);
    }
  } catch (err) {
    capture(err);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

router.post('/ai/summary/:id', async (req, res) => {
  const { id } = req.params;
  const aiSummary = new AiSummary(
    id,
    storageEngine(process.env.AI_SUMMARY_SUBDIR)
  );

  try {
    const cachedSummary = await aiSummary.getCache();

    let summary = '';

    if (!cachedSummary) {
      summary = (await aiSummary.createCache()).toString();
    } else {
      summary = cachedSummary.toString();
    }

    return rpcSuccess(res.status(200), summary, id);
  } catch (err: any) {
    capture(err);
    return rpcError(res, err.message || 'INTERNAL_ERROR', id);
  }
});

router.post('/ai/tts/:id', async (req, res) => {
  const { id } = req.params;
  const aiTextTpSpeech = new AiTextToSpeech(
    id,
    storageEngine(process.env.AI_TTS_SUBDIR)
  );

  try {
    const cachedAudio = await aiTextTpSpeech.getCache();

    let audio: Buffer;

    if (!cachedAudio) {
      try {
        audio = (await aiTextTpSpeech.createCache()) as Buffer;
      } catch (err: any) {
        capture(err);
        return rpcError(res, err, id);
      }
    } else {
      audio = cachedAudio as Buffer;
    }

    res.header('Content-Type', 'audio/mpeg');
    res.attachment(aiTextTpSpeech.filename);
    return res.end(audio);
  } catch (err: any) {
    capture(err);
    return rpcError(res, err.message || 'INTERNAL_ERROR', id);
  }
});

router.get('/moderation', async (req, res) => {
  const { list } = req.query;

  try {
    res.json(
      await getModerationList(list ? (list as string).split(',') : undefined)
    );
  } catch (err) {
    capture(err);
    return rpcError(res, 'INTERNAL_ERROR', '');
  }
});

router.get('/domains/:domain', async (req, res) => {
  const { domain } = req.params;

  try {
    res.json({ domain, space_id: getDomain(domain) });
  } catch (err) {
    capture(err);
    return rpcError(res, 'INTERNAL_ERROR', '');
  }
});

router.get('/nft-claimer', async (req, res) => {
  try {
    return res.json({ snapshotFee: await snapshotFee() });
  } catch (err: any) {
    capture(err);
    return rpcError(res, err, '');
  }
});

router.post('/nft-claimer/deploy', async (req, res) => {
  const {
    address,
    id,
    salt,
    maxSupply,
    mintPrice,
    spaceTreasury,
    proposerFee
  } = req.body;
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
  } catch (err: any) {
    capture(err, { body: req.body });
    return rpcError(res, err, salt);
  }
});

router.post('/nft-claimer/mint', async (req, res) => {
  const { proposalAuthor, address, id, salt } = req.body;
  try {
    return res.json(
      await mintPayload({ proposalAuthor, recipient: address, id, salt })
    );
  } catch (err: any) {
    capture(err, { body: req.body });
    return rpcError(res, err, salt);
  }
});

router.get('/og', async (req, res) => {
  const { url } = req.query;
  if (typeof url !== 'string' || !url) {
    return rpcError(res, 'Invalid Request', '');
  }

  // fetchPreview is best-effort and never throws: failures degrade to an
  // icon-only (or empty) preview.
  return res.json(await fetchPreview(url));
});

router.get('/proxy/:url', async (req, res) => {
  const { url } = req.params;

  try {
    const response = await fetch(url);

    return res.json(await response.json());
  } catch {
    res.status(500).json({
      error: {
        code: 500,
        message: 'failed to fetch URL'
      }
    });
  }
});

export default router;

import express from 'express';
import { rpcError, rpcSuccess } from './helpers/utils';
import VotesReport from './lib/votesReport';
import StorageEngine from './lib/storage/aws'; // file | aws

const router = express.Router();

router.post('/votes/generate/:id', (req, res) => {
  const { id } = req.params;

  try {
    new VotesReport(id, StorageEngine)
      .generateCacheFile()
      .then(() => rpcSuccess(res, 'Cache file generated', id))
      .catch(e => rpcError(res, e, id));
  } catch (e) {
    console.log(e);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

router.post('/votes/:id', async (req, res) => {
  const { id } = req.params;
  const votesReport = new VotesReport(id, StorageEngine);

  try {
    const file = await votesReport.cachedFile();

    if (typeof file === 'string') {
      res.header('Content-Type', 'text/csv');
      res.attachment(votesReport.filename);
      return res.send(Buffer.from(file));
    }

    votesReport
      .canBeCached()
      .then(() => rpcError(res, 'PENDING_GENERATION', id))
      .catch(e => rpcError(res, e, id));
  } catch (e) {
    console.log(e);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

export default router;

import express from 'express';
import { rpcError } from './helpers/utils';
import VotesReport from './helpers/votesReport';

const router = express.Router();

router.post('/votes/generate/:id', (req, res) => {
  const { id } = req.params;
  const votesReport = new VotesReport(id);

  try {
    votesReport
      .generateCacheFile()
      .then(() => {
        return rpcError(res, 'PENDING_GENERATION', id);
      })
      .catch(e => {
        return rpcError(res, e, id);
      });
  } catch (e) {
    console.log(e);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

router.post('/votes/:id', async (req, res) => {
  const { id } = req.params;
  const votesReport = new VotesReport(id);

  try {
    const file = votesReport.cachedFile();

    if (typeof file === 'string') {
      return res.download(file);
    }

    votesReport
      .canBeCached()
      .then(() => {
        return rpcError(res, 'PENDING_GENERATION', id);
      })
      .catch(e => {
        return rpcError(res, e, id);
      });
  } catch (e) {
    console.log(e);
    return rpcError(res, 'INTERNAL_ERROR', id);
  }
});

export default router;

import express from 'express';
import { rpcError } from './helpers/utils';
import VotesReport from './helpers/votesReport';

const router = express.Router();

router.post('/votes/:id', async (req, res) => {
  const { id } = req.params;
  const votesReport = new VotesReport(id);

  try {
    const file = votesReport.cachedFile();

    if (file) {
      return res.download(file);
    }

    votesReport
      .generate()
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

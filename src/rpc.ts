import express from 'express';
import { rpcError, rpcSuccess } from './helpers/utils';
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
        return rpcSuccess(res, 'pending_generation', id);
      })
      .catch(e => {
        return rpcError(res, 500, e, id);
      });
  } catch (e) {
    console.log(e);
    return rpcError(res, 500, e, id);
  }
});

export default router;

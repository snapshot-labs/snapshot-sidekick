import express from 'express';
import bodyParser from 'body-parser';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { URL } from 'url';
import { rpcError, fetchWithKeepAlive } from './helpers/utils';

const router = express.Router();

router.post('/sentry', bodyParser.raw({ type: () => true, limit: '4mb' }), async (req, res) => {
  try {
    const { dsn, event_id } = JSON.parse(req.body.toString().split('\n')[0]);

    if (dsn !== process.env.TUNNEL_SENTRY_DSN) {
      return rpcError(res, 'UNAUTHORIZED', event_id);
    }

    const dnsUri = new URL(dsn);
    const sentryApiUrl = `https://${dnsUri.hostname}/api${dnsUri.pathname}/envelope/`;
    const response = await fetchWithKeepAlive(sentryApiUrl, {
      method: 'POST',
      body: req.body
    });

    const status = response.status;
    if (status !== 200) {
      console.debug(await response.text());
    }
    return res.sendStatus(status);
  } catch (e: any) {
    capture(e);
    rpcError(res, e, '');
  }
});

export default router;

import { initLogger } from '@snapshot-labs/snapshot-sentry';

initLogger({ ignoreErrors: ['RECORD_NOT_FOUND'] });

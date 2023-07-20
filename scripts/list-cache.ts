import 'dotenv/config';
import { storageEngine } from '../src/helpers/utils';

/**
 * Display the contents of the cached storage engine,
 * as configured in .env
 */
async function main() {
  if (process.argv.length < 2) {
    console.error(`Usage: yarn ts-node scripts/list-cache.ts`);
    return process.exit(1);
  }

  const engine = storageEngine(process.env.VOTE_REPORT_SUBDIR);
  const list = await engine.list();

  console.log(`> Found ${list.length} cached items`);
  console.log(list);
}

(async () => {
  try {
    await main();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

import 'dotenv/config';
import { storageEngine } from '../src/helpers/utils';

/**
 * Clear all the cached files in the storage engine,
 * as configured in .env
 */
async function main() {
  if (process.argv.length < 2) {
    console.error(`Usage: yarn ts-node scripts/clear-cache.ts`);
    return process.exit(1);
  }

  const engine = storageEngine(process.env.VOTE_REPORT_SUBDIR);
  const list = await engine.list();

  console.log(`> Deleting ${list.length} cached files on ${engine.constructor.name}`);
  await engine.clear();

  const finalList = await engine.list();
  console.log(`> Finished! ${finalList.length} files remaining`);
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

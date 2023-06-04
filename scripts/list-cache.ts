import 'dotenv/config';
import { storageEngine } from '../src/helpers/utils';

async function main() {
  if (process.argv.length < 2) {
    console.error(`Usage: yarn ts-node scripts/list-cache.ts`);
    return process.exit(1);
  }

  const engine = storageEngine(process.env.VOTE_REPORT_SUBDIR);

  console.log(await engine.list());
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

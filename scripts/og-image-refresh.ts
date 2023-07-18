import 'dotenv/config';
import ogImage, { ImageType } from '../src/lib/ogImage';
import { storageEngine } from '../src/helpers/utils';

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: yarn ts-node scripts/og-image-refresh.ts [proposal|space] [ADDRESS]`);
    return process.exit(1);
  }
  const [, , type, address] = process.argv;

  const og = new ogImage(type as ImageType, address, storageEngine(process.env.OG_IMAGE_SUBDIR));
  await og.createCache();
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

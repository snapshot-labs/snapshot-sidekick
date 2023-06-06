import { Wallet } from '@ethersproject/wallet';
import { Space } from '../../helpers/snapshot';

const requiredEnvKeys = [
  'NFT_CLAIMER_PRIVATE_KEY',
  'NFT_CLAIMER_MINT_VERIFYING_CONTRACT',
  'NFT_CLAIMER_DEPLOY_VERIFYING_CONTRACT',
  'NFT_CLAIMER_DEPLOY_IMPLEMENTATION_ADDRESS',
  'NFT_CLAIMER_SNAPSHOT_FEE',
  'NFT_CLAIMER_SNAPSHOT_ADDRESS',
  'NFT_CLAIMER_SNAPSHOT_TREASURY'
];

const missingEnvKeys: string[] = [];
requiredEnvKeys.forEach(key => {
  if (!process.env[key]) {
    missingEnvKeys.push(key);
  }
});

if (missingEnvKeys.length > 0) {
  throw new Error(
    `NFT Claimer not configured properly, missing env keys: ${missingEnvKeys.join(', ')}`
  );
}

export const signer = new Wallet(process.env.NFT_CLAIMER_PRIVATE_KEY as string);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function mintingAllowed(space: Space) {
  // TODO: Placeholder only for tests, remove once hub return nftClaimer results
  // https://github.com/snapshot-labs/snapshot-hub/pull/581
  // https://github.com/snapshot-labs/snapshot.js/pull/823
  return space.nftClaimer?.enabled ?? true;

  // return space.nftClaimer && space.nftClaimer.address && space.nftClaimer.enabled;
}

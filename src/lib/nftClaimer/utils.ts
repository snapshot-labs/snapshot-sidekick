import { Wallet } from '@ethersproject/wallet';
import { Space } from '../../helpers/snapshot';

const PRIVATE_KEY = process.env.NFT_CLAIMER_PRIVATE_KEY;

if (
  !PRIVATE_KEY ||
  !process.env.NFT_CLAIMER_VERIFYING_CONTRACT ||
  !process.env.NFT_CLAIMER_DEPLOY_IMPLEMENTATION_ADDRESS ||
  !process.env.NFT_CLAIMER_TREASURY_ADDRESS
) {
  throw new Error('NFT Claimer configuration incomplete');
}

export const signer = new Wallet(PRIVATE_KEY);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function mintingAllowed(space: Space) {
  // TODO: Placeholder only for tests, remove once hub return nftClaimer results
  // https://github.com/snapshot-labs/snapshot-hub/pull/581
  // https://github.com/snapshot-labs/snapshot.js/pull/823
  return space.nftClaimer?.enabled ?? true;

  // return space.nftClaimer && space.nftClaimer.address && space.nftClaimer.enabled;
}

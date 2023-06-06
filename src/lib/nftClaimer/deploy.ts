import { getAddress } from '@ethersproject/address';
import { splitSignature } from '@ethersproject/bytes';
import { Interface } from '@ethersproject/abi';
import snapshot from '@snapshot-labs/snapshot.js';
import { Space, fetchSpace } from '../../helpers/snapshot';
import { mintingAllowed, signer } from './utils';
import abi from './deployAbi.json';

const DeployType = {
  Deploy: [
    { name: 'implementation', type: 'address' },
    { name: 'initializer', type: 'bytes' },
    { name: 'salt', type: 'bytes32' }
  ]
};

const HUB_NETWORK = process.env.NETWORK || '1';
const NFT_CLAIMER_NETWORK = process.env.NFT_CLAIMER_NETWORK || '1';

export async function signDeploy(
  address: string,
  id: number,
  maxSupply: number,
  mintPrice: number,
  salt: string
) {
  const space = await fetchSpace(`${id}`);
  // await validateSpace(address, space);

  const abiInterface = new Interface(abi);
  const initializeParams = [
    'NFT-CLAIMER',
    '0.1',
    space?.id,
    maxSupply,
    mintPrice,
    address,
    getAddress(process.env.NFT_CLAIMER_TREASURY_ADDRESS as string)
  ];

  return generateSignature(
    getAddress(process.env.NFT_CLAIMER_DEPLOY_IMPLEMENTATION_ADDRESS as string),
    abiInterface.encodeFunctionData('initialize', initializeParams),
    salt
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validateSpace(address: string, space: Space | null) {
  if (!space) {
    throw new Error('RECORD_NOT_FOUND');
  }

  if ((await snapshot.utils.getSpaceController(space.id, HUB_NETWORK)) !== getAddress(address)) {
    throw new Error('Address is not the space owner');
  }

  if (!mintingAllowed(space)) {
    throw new Error('Space has not allowed minting');
  }
}

async function generateSignature(implementation: string, initializer: string, salt: string) {
  const params = {
    domain: {
      name: 'ProxySpaceCollectionFactory',
      version: '1.0',
      chainId: NFT_CLAIMER_NETWORK,
      verifyingContract: process.env.NFT_CLAIMER_VERIFYING_CONTRACT
    },
    types: DeployType,
    value: {
      implementation: '0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f',
      initializer:
        '0x911a4f6c00000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000539000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000d60349c24db7f1053086ef0d6364b64b1e0313f0000000000000000000000000000000000000000000000000000000000000abcd000000000000000000000000000000000000000000000000000000000000000b4e46542d434c41494d45520000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003302e310000000000000000000000000000000000000000000000000000000000',
      salt
    }
  };

  return splitSignature(await signer._signTypedData(params.domain, params.types, params.value));
}

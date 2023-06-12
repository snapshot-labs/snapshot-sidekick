import { getAddress } from '@ethersproject/address';
import { splitSignature } from '@ethersproject/bytes';
import { Interface } from '@ethersproject/abi';
import { fetchSpace } from '../../helpers/snapshot';
import { signer, validateSpace } from './utils';
import abi from './deployAbi.json';

const DeployType = {
  Deploy: [
    { name: 'implementation', type: 'address' },
    { name: 'initializer', type: 'bytes' },
    { name: 'salt', type: 'bytes32' }
  ]
};

export default async function payload(
  address: string,
  id: string,
  maxSupply: number,
  mintPrice: number,
  proposerFee: number,
  salt: string,
  spaceTreasury: string
) {
  const space = await fetchSpace(id);
  await validateSpace(address, space);

  const initializer = getInitializer(
    address,
    space?.id as string,
    maxSupply,
    mintPrice,
    proposerFee,
    spaceTreasury
  );

  return {
    initializer,
    signature: await generateSignature(
      getAddress(process.env.NFT_CLAIMER_DEPLOY_IMPLEMENTATION_ADDRESS as string),
      initializer,
      salt
    )
  };
}

function getInitializer(
  signerAddress: string,
  spaceId: string,
  maxSupply: number,
  mintPrice: number,
  proposerFee: number,
  spaceTreasury: string
) {
  const abiInterface = new Interface(abi);
  const params = [
    'NFT-CLAIMER',
    '0.1',
    spaceId,
    maxSupply,
    mintPrice,
    proposerFee,
    parseInt(process.env.NFT_CLAIMER_SNAPSHOT_FEE as string),
    getAddress(signerAddress),
    getAddress(process.env.NFT_CLAIMER_SNAPSHOT_ADDRESS as string),
    getAddress(process.env.NFT_CLAIMER_SNAPSHOT_TREASURY as string),
    getAddress(spaceTreasury)
  ];

  return abiInterface.encodeFunctionData('initialize', params);
}

async function generateSignature(implementation: string, initializer: string, salt: string) {
  const params = {
    domain: {
      name: 'ProxySpaceCollectionFactory',
      version: '1.0',
      chainId: process.env.NFT_CLAIMER_NETWORK || '1',
      verifyingContract: process.env.NFT_CLAIMER_DEPLOY_VERIFYING_CONTRACT
    },
    types: DeployType,
    value: {
      implementation,
      initializer,
      salt
    }
  };

  return splitSignature(await signer._signTypedData(params.domain, params.types, params.value));
}

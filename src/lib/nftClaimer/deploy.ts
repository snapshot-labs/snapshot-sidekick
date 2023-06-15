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
    { name: 'salt', type: 'uint256' }
  ]
};

export default async function payload(
  address: string,
  id: string,
  maxSupply: number,
  mintPrice: string,
  proposerFee: number,
  salt: string,
  spaceTreasury: string
) {
  const space = await fetchSpace(id);
  // await validateSpace(address, space);

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
  mintPrice: string,
  proposerFee: number,
  spaceTreasury: string
) {
  const abiInterface = new Interface(abi);
  const params = [
    'TestDAO',
    '0.1',
    spaceId,
    maxSupply,
    BigInt(mintPrice),
    proposerFee,
    getAddress(spaceTreasury),
    getAddress(signerAddress)
  ];

  const initializer = abiInterface.encodeFunctionData('initialize', params);

  return `${process.env.NFT_CLAIMER_DEPLOY_INITIALIZE_SELECTOR}${initializer.slice(10)}`;
}

async function generateSignature(implementation: string, initializer: string, salt: string) {
  const params = {
    domain: {
      name: 'SpaceCollectionFactory',
      version: '0.1',
      chainId: process.env.NFT_CLAIMER_NETWORK || '1',
      verifyingContract: process.env.NFT_CLAIMER_DEPLOY_VERIFYING_CONTRACT
    },
    types: DeployType,
    value: {
      implementation,
      initializer,
      salt: BigInt(salt)
    }
  };

  return splitSignature(await signer._signTypedData(params.domain, params.types, params.value));
}

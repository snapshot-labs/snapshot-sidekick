import { getAddress } from '@ethersproject/address';
import { splitSignature } from '@ethersproject/bytes';
import { Interface } from '@ethersproject/abi';
import { fetchSpace } from '../../helpers/snapshot';
import { signer, validateAddresses, validateSpace } from './utils';
import abi from './deployAbi.json';

const DeployType = {
  Deploy: [
    { name: 'implementation', type: 'address' },
    { name: 'initializer', type: 'bytes' },
    { name: 'salt', type: 'uint256' }
  ]
};

export default async function payload(
  spaceOwner: string,
  id: string,
  maxSupply: number,
  mintPrice: string,
  proposerFee: number,
  salt: string,
  spaceTreasury: string
) {
  const space = await fetchSpace(id);
  await validateSpace(spaceOwner, space);
  if (proposerFee < 0 || proposerFee > 100) {
    throw new Error('proposerFee should be between 0 and 100');
  }
  validateAddresses({ spaceOwner, spaceTreasury });

  const initializer = getInitializer({
    spaceOwner,
    spaceId: space?.id as string,
    maxSupply,
    mintPrice,
    proposerFee,
    spaceTreasury
  });
  const implementationAddress = getAddress(
    process.env.NFT_CLAIMER_DEPLOY_IMPLEMENTATION_ADDRESS as string
  );
  const result = {
    initializer,
    salt,
    verifyingContract: getAddress(process.env.NFT_CLAIMER_DEPLOY_VERIFYING_CONTRACT as string),
    implementation: implementationAddress,
    signature: await generateSignature(implementationAddress, initializer, salt)
  };

  console.debug('Signer', signer.address);
  console.debug('Payload', result);

  return result;
}

function getInitializer(args: {
  spaceId: string;
  maxSupply: number;
  mintPrice: string;
  proposerFee: number;
  spaceTreasury: string;
  spaceOwner: string;
}) {
  const abiInterface = new Interface(abi);
  const params = [
    args.spaceId,
    '0.1',
    args.maxSupply,
    BigInt(args.mintPrice),
    args.proposerFee,
    getAddress(args.spaceTreasury),
    getAddress(args.spaceOwner)
  ];

  const initializer = abiInterface.encodeFunctionData('initialize', params);
  const result = `${process.env.NFT_CLAIMER_DEPLOY_INITIALIZE_SELECTOR}${initializer.slice(10)}`;

  console.debug('Initializer params', params);

  return result;
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

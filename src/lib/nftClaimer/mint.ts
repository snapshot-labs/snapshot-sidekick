import { getAddress } from '@ethersproject/address';
import { splitSignature } from '@ethersproject/bytes';
import { fetchProposal } from '../../helpers/snapshot';
import {
  validateProposal,
  getProposalContract,
  signer,
  numberizeProposalId,
  validateMintInput,
  getSpaceCollection
} from './utils';
import abi from './spaceCollectionImplementationAbi.json';
import { FormatTypes, Interface } from '@ethersproject/abi';

const MintType = {
  Mint: [
    { name: 'proposer', type: 'address' },
    { name: 'recipient', type: 'address' },
    { name: 'proposalId', type: 'uint256' },
    { name: 'salt', type: 'uint256' }
  ]
};

const NFT_CLAIMER_NETWORK = process.env.NFT_CLAIMER_NETWORK;

export default async function payload(input: {
  proposalAuthor: string;
  recipient: string;
  id: string;
  salt: string;
}) {
  const params = await validateMintInput(input);

  const proposal = await fetchProposal(params.id);
  validateProposal(proposal, params.proposalAuthor);
  const spaceId = proposal?.space.id as string;

  const verifyingContract = await getProposalContract(spaceId);
  const contractInfo = await getSpaceCollection(spaceId);

  if (!contractInfo.enabled) {
    throw new Error('Space has closed minting');
  }

  const message = {
    proposer: params.proposalAuthor,
    recipient: params.recipient,
    proposalId: numberizeProposalId(params.id),
    salt: BigInt(params.salt)
  };

  return {
    signature: await generateSignature(verifyingContract, spaceId, message),
    contractAddress: verifyingContract,
    spaceId: proposal?.space.id,
    ...message,
    salt: params.salt,
    abi: new Interface(abi).getFunction('mint').format(FormatTypes.full)
  };
}

async function generateSignature(
  verifyingContract: string,
  domain: string,
  message: Record<string, string | bigint>
) {
  return splitSignature(
    await signer._signTypedData(
      {
        name: domain,
        version: '0.1',
        chainId: NFT_CLAIMER_NETWORK,
        verifyingContract
      },
      MintType,
      message
    )
  );
}

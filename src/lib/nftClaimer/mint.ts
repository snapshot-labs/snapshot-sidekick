import { getAddress } from '@ethersproject/address';
import { splitSignature } from '@ethersproject/bytes';
import { fetchProposal } from '../../helpers/snapshot';
import {
  validateProposal,
  getProposalContract,
  signer,
  numberizeProposalId,
  validateAddresses
} from './utils';

const MintType = {
  Mint: [
    { name: 'proposer', type: 'address' },
    { name: 'recipient', type: 'address' },
    { name: 'proposalId', type: 'uint256' },
    { name: 'salt', type: 'uint256' }
  ]
};

const NFT_CLAIMER_NETWORK = process.env.NFT_CLAIMER_NETWORK || '1';

export default async function payload(
  proposalAuthor: string,
  recipient: string,
  id: string,
  salt: string
) {
  const proposal = await fetchProposal(id);
  validateProposal(proposal, proposalAuthor);
  validateAddresses({ proposalAuthor, recipient });
  const spaceId = proposal?.space.id as string;

  const verifyingContract = await getProposalContract(spaceId);

  const message = {
    proposer: getAddress(proposalAuthor),
    recipient: getAddress(recipient),
    proposalId: numberizeProposalId(id),
    salt: BigInt(salt)
  };

  return {
    signature: await generateSignature(verifyingContract, spaceId, message),
    contractAddress: verifyingContract,
    spaceId: proposal?.space.id,
    ...message,
    salt
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

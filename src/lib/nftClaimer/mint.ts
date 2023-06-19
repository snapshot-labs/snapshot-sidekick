import { getAddress } from '@ethersproject/address';
import { splitSignature } from '@ethersproject/bytes';
import { Proposal, fetchProposal } from '../../helpers/snapshot';
import { validateProposal, getProposalContract, signer, numberizeProposalId } from './utils';

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
  salt: number
) {
  const proposal = await fetchProposal(id);
  validateProposal(proposal, proposalAuthor);

  const verifyingContract = await getProposalContract(proposal as Proposal);

  const message = {
    proposer: getAddress(proposalAuthor),
    recipient: getAddress(recipient),
    proposalId: numberizeProposalId(id),
    salt
  };

  // TODO
  // Enforce only proposal.space.id as allowed value on live prod
  const domain = 'TestDAO';

  return {
    signature: await generateSignature(verifyingContract, domain, message),
    contractAddress: verifyingContract,
    spaceId: proposal?.space.id,
    ...message
  };
}

async function generateSignature(
  verifyingContract: string,
  domain: string,
  message: Record<string, string | number>
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

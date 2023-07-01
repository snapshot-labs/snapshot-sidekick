import { fetchProposal } from '../../../helpers/snapshot';
import { logo, votesIcon, proposalStatus, image, spaceAvatarUrl } from '../utils';

export default async function svg(proposalId: string) {
  const proposal = await fetchProposal(proposalId);

  if (!proposal) {
    throw new Error('ENTRY_NOT_FOUND');
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: '400px'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '800px',
            marginRight: '80px'
          }}
        >
          <div style={{ fontSize: '48px' }}>{proposal.space?.name}</div>
          <div
            style={{
              color: '#111',
              fontSize: '50px',
              fontWeight: '700',
              margin: '24px 0'
            }}
          >
            {proposal.title}
          </div>
          <div style={{ display: 'flex' }}>
            {votesIcon}
            {proposal.votes.toLocaleString('en-US')} votes
          </div>
        </div>

        {proposal.space &&
          (await image(spaceAvatarUrl(proposal.space.id), {
            borderRadius: '100%',
            width: '160px',
            height: '160px'
          }))}
      </div>
      <div style={{ display: 'flex', height: '40px' }}>
        <div style={{ display: 'flex', flexGrow: 1 }}>{proposalStatus(proposal.state)}</div>
        {logo({ textColor: '#57606a', height: 42 })}
      </div>
    </div>
  );
}

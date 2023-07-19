import { image, spaceAvatarUrl } from '../../utils';
import logo from '../../components/logo';
import votesIcon from '../../components/votesIcon';
import statusBadge from '../../components/statusBadge';
import type { Proposal } from '../../../../helpers/snapshot';

export default async function (proposal: Proposal) {
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
            {votesIcon()}
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
        <div style={{ display: 'flex', flexGrow: 1 }}>{statusBadge(proposal.state)}</div>
        {logo({ textColor: '#57606a', height: 42 })}
      </div>
    </div>
  );
}

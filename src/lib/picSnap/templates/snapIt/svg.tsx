import { image, spaceAvatarUrl, spaceAuthorUrl } from '../../utils';
import type { Proposal } from '../../../../helpers/snapshot';
import { shortenAddress } from '../../../../helpers/utils';

export default async function (proposal: Proposal) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {await image(spaceAvatarUrl(proposal.space.id), {
        borderRadius: '100%',
        width: '160px',
        height: '160px'
      })}

      <div
        style={{
          height: 500
        }}
      ></div>

      <div
        style={{
          color: '#111',
          fontSize: '80px',
          fontWeight: '700',
          margin: '24px 0'
        }}
      >
        {proposal.title}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row'
        }}
      >
        {await image(spaceAuthorUrl(proposal.author), {
          borderRadius: '100%',
          width: '64px',
          height: '64px',
          marginRight: '24px'
        })}
        <div style={{ fontSize: '64px' }}>{shortenAddress(proposal.author)}</div>
      </div>
    </div>
  );
}

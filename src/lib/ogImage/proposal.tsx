import satori, { SatoriOptions } from 'satori';
import { fetchProposal } from '../../helpers/snapshot';
import { logo, votesIcon, proposalStatus, fontsData, image } from './utils';

export default async function getProposalSvg(proposalId: string) {
  const proposal = await fetchProposal(proposalId);

  if (!proposal) {
    throw new Error('Proposal not found');
  }

  const WIDTH = 1200;
  const HEIGHT = 600;

  const svg = await satori(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        width: WIDTH,
        height: HEIGHT,
        color: '#57606a',
        fontSize: '40px',
        fontFamily: 'Calibre',
        padding: '80px 80px 0'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: '415px'
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
              color: '#111111',
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

        {await image(`https://cdn.stamp.fyi/space/${proposal.space?.id}?s=160`, {
          borderRadius: '100%',
          width: '160px',
          height: '160px'
        })}
      </div>
      <div style={{ display: 'flex', height: '80px' }}>
        <div style={{ display: 'flex', flexGrow: 1 }}>{proposalStatus(proposal.state)}</div>
        <div
          style={{
            display: 'flex',
            opacity: 0.6
          }}
        >
          {logo}
        </div>
      </div>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: fontsData as SatoriOptions['fonts'],
      debug: false
    }
  );

  return svg;
}

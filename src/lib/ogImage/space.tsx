import satori, { SatoriOptions } from 'satori';
import { fetchSpace } from '../../helpers/snapshot';
import { logo, fontsData, image, membersIcon } from './utils';

export default async function getSpaceSvg(spaceId: string) {
  const space = await fetchSpace(spaceId);

  if (!space) {
    throw new Error('Space not found');
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
          <div style={{ fontSize: '40px', color: '#999' }}>{space.id}</div>
          <div
            style={{
              color: '#111111',
              fontSize: '60px',
              fontWeight: '700',
              margin: '24px 0'
            }}
          >
            {space.name}
          </div>
          <div style={{ fontSize: '48px', height: '190px' }}>{space.about}</div>
        </div>

        {await image(`https://cdn.stamp.fyi/space/${space.id}?s=160`, {
          borderRadius: '100%',
          width: '160px',
          height: '160px'
        })}
      </div>
      <div style={{ display: 'flex', height: '80px' }}>
        <div style={{ display: 'flex', flexGrow: 1 }}>
          {membersIcon}
          {space.members?.length.toLocaleString('en-US')} members
        </div>
        <div
          style={{
            display: 'flex',
            opacity: 0.5
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

import { image, spaceAvatarUrl } from '../../utils';
import logo from '../../components/logo';
import type { Space } from '../../../../helpers/snapshot';

export default async function svg(space: Space) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
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
          <div style={{ fontSize: '40px', color: '#999' }}>{space.id}</div>
          <div
            style={{
              color: '#111',
              fontSize: '60px',
              fontWeight: '700',
              margin: '24px 0'
            }}
          >
            {space.name}
          </div>
          <div style={{ fontSize: '48px', height: '190px' }}>{space.about}</div>
        </div>

        {await image(spaceAvatarUrl(space.id), {
          borderRadius: '100%',
          width: '160px',
          height: '160px'
        })}
      </div>
      <div style={{ display: 'flex', height: '40px' }}>
        <div style={{ display: 'flex', flexGrow: 1 }}>
          {/*{membersIcon}
          {space.followersCount?.toLocaleString('en-US')} members*/}
        </div>
        {logo({ textColor: '#57606a', height: 42 })}
      </div>
    </div>
  );
}

import { logo } from '../utils';

export default async function svg() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        justifyContent: 'center',
        height: '100%',
        width: 1200,
        paddingLeft: '70px'
      }}
    >
      {logo({ width: 700 })}
      <div style={{ marginTop: '0', marginLeft: '160px', fontSize: '70px' }}>
        Where decisions get made
      </div>
    </div>
  );
}

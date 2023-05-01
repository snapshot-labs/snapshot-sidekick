import satori, { SatoriOptions } from 'satori';
import { logo, fontsData } from './utils';

export default async function getHomeSvg() {
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
        justifyContent: 'center',
        padding: '0 0 0 140px'
      }}
    >
      {logo({ width: 700 })}
      <div style={{ marginTop: '0', marginLeft: '160px', fontSize: '70px' }}>
        Where decisions get made
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

import satori, { SatoriOptions } from 'satori';
import getProposalSvg from './proposal';
import getSpaceSvg from './space';
import getHomeSvg from './home';
import { fontsData } from '../utils';
import { loadEmoji, getIconCode, apis } from '../twemoji';
import type { ImageType } from '../index';

async function loadDynamicAsset(emojiType: keyof typeof apis, _code: string, text: string) {
  if (_code === 'emoji') {
    return `data:image/svg+xml;base64,${btoa(await loadEmoji(emojiType, getIconCode(text)))}`;
  }

  return fontsData as any[];
}

export default async function render(type: ImageType, id: string) {
  let content: JSX.Element;

  switch (type) {
    case 'proposal':
      content = await getProposalSvg(id);
      break;
    case 'space':
      content = await getSpaceSvg(id);
      break;
    case 'home':
      content = await getHomeSvg();
      break;
    default:
      throw new Error('Invalid image type');
  }

  return await satori(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        color: '#57606a',
        fontSize: '40px',
        fontFamily: 'Calibre',
        padding: '80px'
      }}
    >
      {content}
    </div>,
    {
      width: 1200,
      height: 600,
      fonts: fontsData as SatoriOptions['fonts'],
      loadAdditionalAsset: async (code, text) => {
        return loadDynamicAsset('twemoji', code, text);
      },
      debug: false
    }
  );
}

import satori, { SatoriOptions } from 'satori';
import getProposalSvg from './ogProposal';
import getSpaceSvg from './ogSpace';
import getHomeSvg from './ogHome';
import getSnapItSvg from './snapIt';
import { fontsData, loadDynamicAsset } from '../utils';
import type { ImageType } from '../index';

const OG_DIMENSIONS = {
  width: 1200,
  height: 600,
  background: '#fff'
};

const templates: Record<
  ImageType,
  {
    prepare: (id: string) => Promise<JSX.Element>;
    width: number;
    height: number;
    background: string;
  }
> = {
  'og-home': {
    ...OG_DIMENSIONS,
    prepare: () => getHomeSvg()
  },
  'og-space': {
    ...OG_DIMENSIONS,
    prepare: (id: string) => getSpaceSvg(id)
  },
  'og-proposal': {
    ...OG_DIMENSIONS,
    prepare: (id: string) => getProposalSvg(id)
  },
  'snap-it': {
    width: 1200,
    height: 1200,
    background: 'linear-gradient(135deg, #faf5f1 0%, #f2f2fc 100%)',
    prepare: (id: string) => getSnapItSvg(id)
  }
};

export default async function render(type: ImageType, id: string) {
  const { width, height, prepare, background } = templates[type];
  const content = await prepare(id);

  return await satori(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background,
        width,
        height,
        color: '#57606a',
        fontSize: '40px',
        fontFamily: 'Calibre',
        padding: '80px'
      }}
    >
      {content}
    </div>,
    {
      width,
      height,
      fonts: fontsData as SatoriOptions['fonts'],
      loadAdditionalAsset: async (code, text) => {
        return loadDynamicAsset('twemoji', code, text);
      },
      debug: false
    }
  );
}

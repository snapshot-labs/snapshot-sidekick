import satori, { SatoriOptions } from 'satori';
import getProposalSvg from './ogProposal';
import getSpaceSvg from './ogSpace';
import getHomeSvg from './ogHome';
import { fontsData, loadDynamicAsset } from '../utils';
import type { ImageType } from '../index';

const OG_DIMENSIONS = {
  width: 1200,
  height: 600
};

const templates: Record<
  ImageType,
  { prepare: (id: string) => Promise<JSX.Element>; width: number; height: number }
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
  }
};

export default async function render(type: ImageType, id: string) {
  const { width, height, prepare } = templates[type];
  const content = await prepare(id);

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

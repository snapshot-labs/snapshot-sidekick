import { Resvg } from '@resvg/resvg-js';
import getProposalSvg from './proposal';
import getSpaceSvg from './space';

export type ImageType = 'space' | 'proposal';

class ogImage {
  type: ImageType;
  proposalId: string;

  constructor(type: ImageType, proposalId: string) {
    this.type = type;
    this.proposalId = proposalId;
  }

  async getSvg() {
    switch (this.type) {
      case 'proposal':
        return getProposalSvg(this.proposalId);
      case 'space':
        return getSpaceSvg(this.proposalId);
      default:
        throw new Error('Invalid image type');
    }
  }

  async getImage() {
    const opts = {
      font: {
        loadSystemFonts: false
      }
    };

    const resvg = new Resvg((await this.getSvg()) as string, opts);
    const imageData = resvg.render();

    return imageData.asPng();
  }
}

export default ogImage;

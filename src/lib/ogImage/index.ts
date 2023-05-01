import { Resvg } from '@resvg/resvg-js';
import getProposalSvg from './proposal';
import getSpaceSvg from './space';
import getHomeSvg from './home';

export type ImageType = 'space' | 'proposal' | 'home';

class ogImage {
  type: ImageType;
  id: string;

  constructor(type: ImageType, id: string) {
    this.type = type;
    this.id = id;
  }

  async getSvg() {
    switch (this.type) {
      case 'proposal':
        return getProposalSvg(this.id);
      case 'space':
        return getSpaceSvg(this.id);
      case 'home':
        return getHomeSvg();
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

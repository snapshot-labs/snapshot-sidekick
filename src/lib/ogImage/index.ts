import { Resvg } from '@resvg/resvg-js';
import render from './templates';

export type ImageType = 'space' | 'proposal' | 'home';

class ogImage {
  type: ImageType;
  id: string;

  constructor(type: ImageType, id: string) {
    this.type = type;
    this.id = id;
  }

  async getSvg() {
    return render(this.type, this.id);
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

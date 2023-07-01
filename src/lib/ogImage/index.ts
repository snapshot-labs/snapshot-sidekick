import { Resvg } from '@resvg/resvg-js';
import render from './templates/index';
import { IStorage } from '../storage/types';

export type ImageType = 'space' | 'proposal' | 'home';

class ogImage {
  type: ImageType;
  id: string;
  filename: string;
  storage: IStorage;

  constructor(type: ImageType, id: string, storage: IStorage) {
    this.type = type;
    this.id = id;
    this.filename = `${[type, id].filter(v => v).join('-')}.png`;
    this.storage = storage;
  }

  async getSvg() {
    return render(this.type, this.id);
  }

  async getImage(force = false) {
    const cache = await this.storage.get(this.filename);

    if (cache && !force) {
      return cache;
    }

    const opts = {
      font: {
        loadSystemFonts: false
      }
    };

    const resvg = new Resvg((await this.getSvg()) as string, opts);
    const imageData = resvg.render();
    const image = imageData.asPng();

    this.storage.set(this.filename, image);

    return image;
  }
}

export default ogImage;

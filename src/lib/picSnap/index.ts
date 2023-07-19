import { Resvg } from '@resvg/resvg-js';
import render from './templates/index';
import { IStorage } from '../storage/types';
import Cache from '../cache';

export type ImageType = 'og-space' | 'og-proposal' | 'og-home';

export default class picSnap extends Cache {
  type: ImageType;

  constructor(type: ImageType, id: string, storage: IStorage) {
    super(id, storage);
    this.type = type;
    this.filename = `${[type, id].filter(v => v).join('-')}.png`;
  }

  getSvg() {
    return render(this.type, this.id);
  }

  toString() {
    return `PicSnap#${this.id}`;
  }

  async getContent() {
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

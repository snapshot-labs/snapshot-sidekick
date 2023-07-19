import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';
import { loadEmoji, getIconCode, apis } from './twemoji';

export const fontsData = [
  {
    name: 'Calibre',
    data: readFileSync(join(process.cwd(), 'src', 'assets', 'fonts', 'Calibre-Medium-Custom.woff')),
    weight: 400,
    style: 'normal'
  },
  {
    name: 'Calibre',
    data: readFileSync(
      join(process.cwd(), 'src', 'assets', 'fonts', 'Calibre-Semibold-Custom.woff')
    ),
    weight: 700,
    style: 'bold'
  }
];

/**
 * Return an image JSX node with the given src encoded as Base64 PNG
 *
 * Image conversion is done to always ensure the output is of type PNG,
 * as Satori library does not support some image type, such as WEBP
 */
export async function image(src: string, style: Record<string, string>) {
  const imageUrlData = await fetch(src);
  const buffer = await imageUrlData.arrayBuffer();
  const stringifiedBuffer = Buffer.from(await sharp(buffer).png().toBuffer()).toString('base64');

  return <img src={`data:image/png;base64,${stringifiedBuffer}`} style={style} />;
}

export function spaceAvatarUrl(spaceId: string, size = 160) {
  return `https://cdn.stamp.fyi/space/${spaceId}?s=${size}`;
}

export async function loadDynamicAsset(emojiType: keyof typeof apis, _code: string, text: string) {
  if (_code === 'emoji') {
    return `data:image/svg+xml;base64,${btoa(await loadEmoji(emojiType, getIconCode(text)))}`;
  }

  return fontsData as any[];
}

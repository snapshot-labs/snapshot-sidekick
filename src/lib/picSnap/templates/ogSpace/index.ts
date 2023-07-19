import { fetchSpace } from '../../../../helpers/snapshot';
import template from './svg';

export default async function svg(spaceId: string) {
  const space = await fetchSpace(spaceId);

  if (!space) {
    throw new Error('ENTRY_NOT_FOUND');
  }

  return template(space);
}

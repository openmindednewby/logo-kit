import type { Mark } from '../core/types';

const IDENT = /^[A-Za-z_$][\w$]*$/;
const key = (name: string): string => (IDENT.test(name) ? name : `'${name}'`);

/** Returns a brand-package markGeometry.ts: the viewBox, each layer's path by name, and transforms when any layer has one. */
export function geometryModule(mark: Mark): string {
  const paths = mark.layers.map((l) => `  ${key(l.name)}: '${l.d}',`).join('\n');
  const lines = mark.layers.filter((l) => l.transform !== undefined).map((l) => `  ${key(l.name)}: '${l.transform ?? ''}',`);
  const block = lines.join('\n');
  const transforms = lines.length > 0 ? `\nexport const MARK_TRANSFORMS = {\n${block}\n} as const;\n` : '';
  return `export const MARK_VIEW_BOX = '${mark.viewBox}';\n\nexport const MARK_PATHS = {\n${paths}\n} as const;\n${transforms}`;
}

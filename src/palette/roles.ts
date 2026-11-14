import type { Mark } from '../core/types';

/** Returns every palette role the mark's layers paint with, in first-use order. */
export function rolesOf(mark: Mark): string[] {
  const roles: string[] = [];
  for (const layer of mark.layers) {
    for (const item of [...layer.paint.light, ...layer.paint.dark]) {
      for (const role of [item.fill, item.stroke]) {
        if (role !== undefined && !roles.includes(role)) {
          roles.push(role);
        }
      }
    }
  }
  return roles;
}

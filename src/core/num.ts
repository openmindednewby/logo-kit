const PLACES = 3;

/** Returns a number written with at most three decimals and no trailing zeros. */
export function fmt(value: number): string {
  return String(Number(value.toFixed(PLACES)));
}

/** Returns the item at an index or throws when it is missing. */
export function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`index ${index} out of range`);
  }
  return item;
}

/** Returns text safe inside an XML attribute or element. */
export function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

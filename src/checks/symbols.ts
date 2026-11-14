export interface SensitiveSymbol {
  id: string;
  label: string;
  silhouettes: string[];
}

const svg = (body: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;
const crescentBody = (dx: number, r: number): string =>
  `<mask id="c"><rect width="100" height="100" fill="#fff"/><circle cx="${50 + dx}" cy="50" r="${r}" fill="#000"/></mask><circle cx="50" cy="50" r="40" mask="url(#c)"/>`;
const starPoints = (cx: number, cy: number, r: number, n: number, inner: number): string =>
  Array.from({ length: 2 * n }, (_, k) => {
    const t = -Math.PI / 2 + (Math.PI * k) / n;
    const rr = k % 2 === 0 ? r : r * inner;
    return `${(cx + rr * Math.cos(t)).toFixed(2)},${(cy + rr * Math.sin(t)).toFixed(2)}`;
  }).join(' ');
const star5 = (cx: number, cy: number, r: number): string => `<polygon points="${starPoints(cx, cy, r, 5, 0.4)}"/>`;
const tri = (deg: number): string =>
  [0, 120, 240].map((a) => {
    const t = ((deg + a) * Math.PI) / 180;
    return `${(50 + 45 * Math.cos(t)).toFixed(2)},${(50 + 45 * Math.sin(t)).toFixed(2)}`;
  }).join(' ');
const ironArm = (deg: number): string => `<polygon transform="rotate(${deg} 50 50)" points="30,6 70,6 56,44 44,44"/>`;

/** The sensitive religious, political and protected symbols a mark must not resemble (silhouettes in a 100 x 100 box). */
export const SYMBOLS: readonly SensitiveSymbol[] = [
  { id: 'crescent-star', label: 'Crescent and star', silhouettes: [svg(crescentBody(14, 33) + star5(72, 50, 15)), svg(crescentBody(10, 32) + star5(76, 50, 12))] },
  { id: 'red-crescent', label: 'Crescent (Red Crescent emblem)', silhouettes: [svg(crescentBody(14, 33)), svg(crescentBody(10, 32))] },
  { id: 'latin-cross', label: 'Latin cross', silhouettes: [svg('<rect x="42" y="8" width="16" height="84"/><rect x="22" y="28" width="56" height="16"/>')] },
  { id: 'greek-cross', label: 'Greek cross (Red Cross emblem)', silhouettes: [svg('<rect x="38" y="12" width="24" height="76"/><rect x="12" y="38" width="76" height="24"/>')] },
  { id: 'star-of-david', label: 'Star of David', silhouettes: [svg(`<polygon points="${tri(-90)}"/><polygon points="${tri(90)}"/>`)] },
  { id: 'swastika', label: 'Swastika', silhouettes: [svg('<rect x="44" y="15" width="12" height="70"/><rect x="15" y="44" width="70" height="12"/><rect x="44" y="15" width="41" height="12"/><rect x="73" y="44" width="12" height="41"/><rect x="15" y="73" width="41" height="12"/><rect x="15" y="15" width="12" height="41"/>')] },
  { id: 'hammer-and-sickle', label: 'Hammer and sickle', silhouettes: [svg('<path d="M28 28 A30 30 0 1 0 78 60" fill="none" stroke="#000" stroke-width="10"/><g transform="rotate(-45 50 50)"><rect x="46" y="28" width="8" height="58"/><rect x="34" y="20" width="32" height="12"/></g>')] },
  { id: 'iron-cross', label: 'Iron cross', silhouettes: [svg([0, 90, 180, 270].map(ironArm).join('') + '<rect x="42" y="42" width="16" height="16"/>')] },
  { id: 'celtic-cross', label: 'Celtic cross', silhouettes: [svg('<rect x="44" y="8" width="12" height="84"/><rect x="18" y="32" width="64" height="12"/><circle cx="50" cy="38" r="20" fill="none" stroke="#000" stroke-width="7"/>')] },
  { id: 'ankh', label: 'Ankh', silhouettes: [svg('<ellipse cx="50" cy="26" rx="13" ry="17" fill="none" stroke="#000" stroke-width="8"/><rect x="45" y="42" width="10" height="50"/><rect x="24" y="42" width="52" height="10"/>')] },
  { id: 'pentagram', label: 'Five-point star (pentagram)', silhouettes: [svg(star5(50, 52, 46))] },
  { id: 'yin-yang', label: 'Yin and yang', silhouettes: [svg('<path d="M50 5A45 45 0 0 1 50 95A22.5 22.5 0 0 1 50 50A22.5 22.5 0 0 0 50 5Z"/><circle cx="50" cy="27.5" r="7"/>')] },
  { id: 'orthodox-cross', label: 'Orthodox cross', silhouettes: [svg('<rect x="44" y="6" width="12" height="88"/><rect x="36" y="16" width="28" height="8"/><rect x="22" y="32" width="56" height="10"/><rect x="30" y="68" width="40" height="8" transform="rotate(-20 50 72)"/>')] },
];

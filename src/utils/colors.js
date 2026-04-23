export const MARKER_COLORS = [
  '#4D6FA5', // blue
  '#2E8A7A', // teal
  '#5A8A3E', // green
  '#8A6B2E', // amber
  '#C06030', // orange
  '#A84040', // red
  '#7040A0', // purple
  '#A04080', // magenta
  '#2E6A8A', // steel blue
  '#5A7A40', // olive
  '#8A3A5A', // rose
  '#404A8A', // indigo
];

export function markerColor(index) {
  return MARKER_COLORS[index % MARKER_COLORS.length];
}

export function agentColor(agentName) {
  if (!agentName) return MARKER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < agentName.length; i++) {
    hash = (hash * 31 + agentName.charCodeAt(i)) >>> 0;
  }
  return MARKER_COLORS[hash % MARKER_COLORS.length];
}

import { converter } from "culori";

const toOklch = converter("oklch");

function formatOklchFromHex(hex) {
  const color = toOklch(hex);
  if (!color) {
    throw new Error(`Could not convert ${hex} to OKLCH`);
  }

  const l = Number(color.l.toFixed(4));
  const c = Number(color.c.toFixed(4));
  const h = Number((color.h ?? 0).toFixed(2));

  return `oklch(${l} ${c} ${h})`;
}

const palette = {
  // Brand / key colors
  "ih-magenta": "#c03bc4",
  "ih-magenta-light": "#d59ed7",
  "ih-magenta-dark": "#702573",
  "ih-blue": "#0078d4",
  "ih-blue-light": "#8dc8e8",
  "ih-green": "#4abe3b",
  "ih-teal-deep": "#225b62",
  "ih-orange-light": "#e87a5f",

  // Semantic UI tokens
  background: "#0b0a0d",
  card: "#12101a",
  popover: "#12101a",
  foreground: "#f6f3f8",
  "muted-foreground": "#bfb7c7",
  secondary: "#1b1822",
  muted: "#1b1822",
  accent: "#221f2a",
  border: "#2b2734",
  input: "#2b2734",
  destructive: "#ef4444",

  // Charts
  "chart-1": "#0078d4",
  "chart-2": "#225b62",
  "chart-3": "#4abe3b",
  "chart-4": "#c03bc4",
  "chart-5": "#e87a5f",
};

for (const [name, hex] of Object.entries(palette)) {
  console.log(`--${name}: ${formatOklchFromHex(hex)};`);
}

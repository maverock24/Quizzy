/**
 * Converts HSL values to a hex color string
 * @param h - Hue value (0-360)
 * @param s - Saturation value (0-100)
 * @param l - Lightness value (0-100)
 * @returns Hex color string (e.g. #FF5500)
 */
export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * Generates a random color with consistent lightness and saturation
 * @param saturation - The saturation value (0-100)
 * @param lightness - The lightness value (0-100)
 * @returns A hex color string
 */
export const getRandomConsistentColor = (saturation: number = 65, lightness: number = 55): string => {
  // Generate a random hue (0-360)
  const hue = Math.floor(Math.random() * 360);
  return hslToHex(hue, saturation, lightness);
};

/**
 * Creates a palette of colors with consistent saturation and lightness
 * @param count - Number of colors to generate
 * @param saturation - The saturation value (0-100)
 * @param lightness - The lightness value (0-100)
 * @returns Array of hex color strings
 */
export const generateConsistentColorPalette = (
  count: number, 
  saturation: number = 65, 
  lightness: number = 55
): string[] => {
  const colors: string[] = [];
  const hueStep = 360 / count;
  
  for (let i = 0; i < count; i++) {
    // Distribute hues evenly around the color wheel
    const hue = i * hueStep;
    colors.push(hslToHex(hue, saturation, lightness));
  }
  
  return colors;
};
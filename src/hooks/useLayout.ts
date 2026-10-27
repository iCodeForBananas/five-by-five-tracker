import { useWindowDimensions } from 'react-native';

/** Reference phone width the type scale is designed at. */
const BASE = 390;

/**
 * Width-derived layout metrics so phones from 360 to 430pt and tablets share one set of rules
 * instead of hardcoded sizes. Body text stays fixed (the OS font scale already applies to it);
 * only display type and spacing scale with the window.
 */
export function useLayout() {
  const { width } = useWindowDimensions();
  const scale = Math.min(1.15, Math.max(0.88, width / BASE));
  return {
    width,
    /** Phone-sized: stack rows vertically instead of side by side. */
    compact: width < 600,
    /** Two-column layout for the main screen. */
    wide: width >= 900,
    gutter: width < 380 ? 12 : width < 600 ? 16 : 24,
    cardPad: width < 380 ? 16 : 20,
    /** Scale a display font size (headings, big numbers) to the window width. */
    type: (size: number) => Math.round(size * scale),
  };
}

export type Layout = ReturnType<typeof useLayout>;

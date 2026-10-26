import Svg, { Path } from 'react-native-svg';

export function Check({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 11.5 L9.5 16 L17 6.5" />
    </Svg>
  );
}

export function ResetIcon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9 A6 6 0 1 0 5 4.5" />
      <Path d="M3 2 L3 6 L7 6" />
    </Svg>
  );
}

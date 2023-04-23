import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    // Colors
    colorGreen: string;
    colorRed: string;
    colorAmber: string;
    bgDark1: string;
    bg: string;
    bgLight1: string;
    borderDark: string;
    borderLight: string;
    borderLighter: string;
    borderLighterer: string;
    hint: string;
    hintRGB: string;
    hintDark1: string;
    textNormal: string;
    // Sizing
    spacingPx: number;
  }
}
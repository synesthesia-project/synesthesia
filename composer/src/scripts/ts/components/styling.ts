import * as styledComponents from 'styled-components';

const {
  default: styled,
  css,
  injectGlobal,
  keyframes,
  ThemeProvider
} = styledComponents as styledComponents.ThemedStyledComponentsModule<ThemeVariables>;

export interface ThemeVariables {
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
  hint: string;
  hintDark1: string;
  layerSideBg: string;
  // Sizing
  spacingPx: number;
  layerSideColumnWidthPx: number;
  visualizationWidthPx: number;
}

export const defaultTheme: ThemeVariables = {
  colorGreen: '#98c379',
  colorRed: '#e06c75',
  colorAmber: '#d19a66',

  bgDark1: '#252524',
  bg: '#2a2a2b',
  bgLight1: '#353638',
  borderDark: '#151516',
  borderLight: '#1c1d1d',
  borderLighter: '#252524',

  // TODO: Colors to replace
  hint: '#4286f4',
  hintDark1: '#2a77f3',
  // END TODO
  layerSideBg: '#303133',

  spacingPx: 5,
  layerSideColumnWidthPx: 130,
  visualizationWidthPx: 100
};

export { styled, css, injectGlobal, keyframes, ThemeProvider };

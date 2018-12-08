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
  borderLighterer: string;
  hint: string;
  hintDark1: string;
  textNormal: string;
  // Sizing
  spacingPx: number;
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
  borderLighterer: '#6b6b67',
  hint: '#4286f4',
  hintDark1: '#2a77f3',
  textNormal: '#F3F3F5',
  spacingPx: 15
};

// tslint:disable-next-line: no-unused-expression
injectGlobal`
* {
  box-sizing: border-box;
}

body {
  background: #111;
  margin: 0;
  padding: 0;
  font-size: 14px;
}
`;

export { styled, css, injectGlobal, keyframes, ThemeProvider };

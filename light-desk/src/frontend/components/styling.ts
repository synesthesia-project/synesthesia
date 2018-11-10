import * as styledComponents from 'styled-components';

const {
  default: styled,
  css,
  injectGlobal,
  keyframes,
  ThemeProvider
} = styledComponents as styledComponents.ThemedStyledComponentsModule<ThemeVariables>;

export interface ThemeVariables {
  spacingPx: number;
}

export const defaultTheme: ThemeVariables = {
  spacingPx: 20
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
}
`;

export { styled, css, injectGlobal, keyframes, ThemeProvider };

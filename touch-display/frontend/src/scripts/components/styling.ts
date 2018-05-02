import * as styledComponents from 'styled-components';

const {
  default: styled,
  css,
  injectGlobal,
  keyframes,
  ThemeProvider
} = styledComponents as styledComponents.ThemedStyledComponentsModule<ThemeVariables>;

export interface ThemeVariables {
}

export const defaultTheme: ThemeVariables = {
};

export { styled, css, injectGlobal, keyframes, ThemeProvider };

import * as styledComponents from 'styled-components';

const {
  default: styled,
  css,
  injectGlobal,
  keyframes,
  ThemeProvider
} = styledComponents as styledComponents.ThemedStyledComponentsModule<ThemeVariables>;

/** The type of the parameter passed to functions in the tagged template literal */
export type P = styledComponents.ThemeProps<ThemeVariables>;

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
  hintRGB: string;
  hintDark1: string;
  layerSideBg: string;
  buttonTextNormal: string;
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
  hintRGB: '66, 134, 244',
  hintDark1: '#2a77f3',
  // END TODO
  layerSideBg: '#303133',
  buttonTextNormal: '#F3F3F5',

  spacingPx: 5,
  layerSideColumnWidthPx: 130,
  visualizationWidthPx: 100
};

export { styled, css, injectGlobal, keyframes, ThemeProvider };

// Mixins and helper functions

const buttonStateNormal = css`
  color: ${p => p.theme.buttonTextNormal};
  background: linear-gradient(to bottom, #4f5053, #343436);
  text-shadow: 0 -1px rgba(0, 0, 0, 0.7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 0 0 rgba(0,0,0,0.25);
`;

const buttonStateNormalHover = css`
  color: ${p => p.theme.buttonTextNormal};
  outline-color: rgba(243, 243, 245, 0.3);
  background: linear-gradient(to bottom, #5e6064, #393A3B);
  text-shadow: 0 -1px rgba(0, 0, 0, 0.7);
`;

const buttonStateNormalActive = css`
  color: #ffffff;
  outline-color: rgba(255, 255, 255, 0.3);
  background: linear-gradient(to bottom, #242525, #37383A);
  text-shadow: 0 -1px rgba(0, 0, 0, 0.4);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2), 0 1px 0 0 rgba(255,255,255,0.15);
  transition-duration: 50ms;
`;

const buttonStatePressed = css`
  ${buttonStateNormalActive}
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1), 0 1px 0 0 rgba(255,255,255,0.15);
`;

const buttonStatePressedHover = css`
  ${buttonStateNormalActive}
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1), 0 1px 0 0 rgba(255,255,255,0.15);
  background: linear-gradient(to bottom, #282929, #414243);
`;

const buttonStatePressedActive = buttonStateNormalActive;

const buttonStateDisabled = css`
  ${buttonStateNormal}

  cursor: default;
  background: ${p => p.theme.bg} !important;
  color: rgba(${p => p.theme.buttonTextNormal}, 0.4);
`;

const button = css`
  position: relative;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 200ms;
  padding: 6px 8px;
  border-radius: 3px;
  border: 1px solid ${p => p.theme.borderDark};
  overflow: hidden;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  ${buttonStateNormal}

  &:hover {
    ${buttonStateNormalHover}
  }

  &:active {
    ${buttonStateNormalActive}
  }
`;

export const buttonPressed = css`
  ${buttonStatePressed}

  &:hover {
    ${buttonStatePressedHover}
  }

  &:active {
    ${buttonStatePressedActive}
  }
`;

export const buttonDisabled = css`
  ${buttonStateDisabled}

  &:hover, &:active {
    ${buttonStateDisabled}
  }
`;

export const rectButton = button;

export const rectIconButton = css`
  ${rectButton}

  padding: 0;
`;

export const rectButtonSmall = css`
  ${rectButton}

  font-size: 12px;
  padding: 4px 6px;
`;

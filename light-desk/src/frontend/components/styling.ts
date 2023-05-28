import { DefaultTheme, createGlobalStyle, css } from 'styled-components';
import { FONTS } from '../../shared/static';

export const defaultTheme: DefaultTheme = {
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
  hintRGB: '66, 134, 244',
  hintDark1: '#2a77f3',
  textNormal: '#F3F3F5',
  spacingPx: 15,
};

export const GlobalStyle = createGlobalStyle`
* {
  box-sizing: border-box;
}

body {
  background: #111;
  margin: 0;
  padding: 0;
  font-size: 14px;
  font-family: sans-serif;

  &.touch-mode * {
    cursor: none !important;
  }
}

@font-face {
  font-family: 'Material Symbols Outlined';
  font-style: normal;
  src: url(${FONTS.materialSymbols}) format('woff');
}
`;

export const buttonStateNormal = css`
  color: ${(p) => p.theme.textNormal};
  background: linear-gradient(to bottom, #4f5053, #343436);
  text-shadow: 0 -1px rgba(0, 0, 0, 0.7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 1px 0 0 rgba(0, 0, 0, 0.25);
`;

export const buttonStateNormalHover = css`
  color: ${(p) => p.theme.textNormal};
  outline-color: rgba(243, 243, 245, 0.3);
  background: linear-gradient(to bottom, #5e6064, #393a3b);
  text-shadow: 0 -1px rgba(0, 0, 0, 0.7);
`;

export const buttonStateNormalActive = css`
  color: #ffffff;
  outline-color: rgba(255, 255, 255, 0.3);
  background: linear-gradient(to bottom, #242525, #37383a);
  text-shadow: 0 -1px rgba(0, 0, 0, 0.4);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2),
    0 1px 0 0 rgba(255, 255, 255, 0.15);
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
  background: ${(p) => p.theme.bg} !important;
  color: rgba(${(p) => p.theme.textNormal}, 0.4);
`;

const button = css`
  position: relative;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 200ms;
  border-radius: 3px;
  border: 1px solid ${(p) => p.theme.borderDark};
  overflow: hidden;
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

export const touchIndicatorNormal = css`
  position: absolute;
  top: -6px;
  right: -6px;
  left: -6px;
  bottom: -6px;
  border-radius: 6px;
  border: 2px solid rgba(0, 0, 0, 0);
  background-color: none;
  transition: border-color 300ms;
`;

export const touchIndicatorTouching = css`
  border-color: ${(p) => p.theme.hint};
  background-color: rgba(${(p) => p.theme.hintRGB}, 0.2);
  transition: border-color 0s;
`;

import * as React from 'react';
import styled from 'styled-components';

interface Props {
  /**
   * Icon name from https://fonts.google.com/icons?icon.style=Outlined
   */
  icon: string;
}

const Span = styled.span`
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 22px;
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
  font-variation-settings: 'wght' 300, 'GRAD' -25;
`;

const Icon: React.FunctionComponent<Props> = ({ icon }) => <Span>{icon}</Span>;

export { Icon };

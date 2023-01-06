import * as React from 'react';
import { styled, rectButton, buttonPressed, buttonDisabled } from '../styling';
import { IconType } from 'react-icons';

interface Props {
  className?: string;
  icon: IconType;
  buttonText?: string;
  active?: boolean;
  disabled?: boolean;
  buttonSizePx: number;
  title?: string;
}

class DropDownButton extends React.Component<Props> {
  public render() {
    return (
      <div
        tabIndex={0}
        className={`${this.props.className} ${
          this.props.active ? 'active' : ''
        } ${this.props.disabled ? 'disabled' : ''}`}
      >
        <div className="button" title={this.props.title}>
          <this.props.icon />
          {this.props.buttonText ? <span>{this.props.buttonText}</span> : null}
        </div>
        <div className="drop-down">{this.props.children}</div>
      </div>
    );
  }
}

const StyledDropDownButton = styled(DropDownButton)`
  position: relative;
  height: ${(p) => p.buttonSizePx}px;
  outline: none;

  > .button {
    display: block;
    height: 100%;
    min-width: ${(p) => p.buttonSizePx}px;
    ${rectButton}

    > span {
      margin-left: ${(p) => p.theme.spacingPx}px;
    }
  }

  > .drop-down {
    display: none;
  }

  &.disabled {
    > .button {
      opacity: 0.5;
      ${buttonDisabled}
    }
  }

  &.active {
    > .button {
      color: ${(p) => p.theme.hint} !important;
    }
  }

  &:not(.disabled) {
    &:focus,
    &:focus-within {
      > .button {
        ${buttonPressed}
      }

      > .drop-down {
        display: block;
        position: absolute;
        bottom: ${(p) => p.buttonSizePx + p.theme.spacingPx / 2}px;
        left: 0;
        border-radius: 3px;
        border: 1px solid ${(p) => p.theme.borderDark};
        background-color: ${(p) => p.theme.bgLight1};
        box-shadow: 0px 1px 8px 0px rgba(0, 0, 0, 0.3);
        min-width: 100%;
        min-height: 100%;
        padding: ${(p) => p.theme.spacingPx}px;
      }
    }
  }
`;

export { StyledDropDownButton as DropDownButton };

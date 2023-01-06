import * as React from 'react';
import {KEYCODES} from '../../util/input';

interface PropertyInputProperties {
  id?: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * An input that only propigates its changes upwards when the user hits enter
 * or unfocuses the element
 */
export class DelayedPropigationInput extends React.Component<PropertyInputProperties, Record<string, never>> {

  /* True when propigating the result of a user-triggered event upwards */
  private changing = false;

  private ref: HTMLInputElement | null = null;

  public constructor(props: PropertyInputProperties) {
    super(props);

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }

  public componentWillReceiveProps(newProps: PropertyInputProperties) {
    if (this.ref && !this.changing && this.props.value !== newProps.value) {
      this.ref.value = newProps.value;
    }
  }

  private onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.keyCode === KEYCODES.ENTER) {
      e.preventDefault();
      e.stopPropagation();
      this.changing = true;
      this.props.onChange(e.currentTarget.value);
      setTimeout(() => this.changing = false, 0);
    }
  }

  private onBlur(e: React.FocusEvent<HTMLInputElement>) {
    this.changing = true;
    this.props.onChange(e.currentTarget.value);
    setTimeout(() => this.changing = false, 0);
  }

  public render() {
    return (
      <input
        ref={i => this.ref = i}
        id={this.props.id}
        type={this.props.type}
        defaultValue={this.props.value}
        onKeyDown={this.onKeyDown}
        onBlur={this.onBlur} />
    );
  }

}

import * as React from "react";
import * as ReactDOM from "react-dom";

export abstract class BaseComponent<Props, State> extends React.Component<Props, State> {

  private _reactRootElement: JQuery;

  protected $() {
    return $((ReactDOM.findDOMNode(this) as any).shadowRoot);
  }

  protected $reactRoot() {
    if (!this._reactRootElement)
      this._reactRootElement = this.$().find('[data-reactroot]');
    return this._reactRootElement;
  }

  /**
   * Get the position of this element relative to the document
   */
  public getOffset(): JQueryCoordinates {
    return this.$reactRoot().offset();
  }

}

/**
 * Styling options for the [[Group]] component
 *
 * Default Styling: [[GROUP_DEFAULT_STYLE]]
 */
export interface GroupComponentStyle {
  /**
   * In which way should child components of this group be organized?
   */
  direction: 'horizontal' | 'vertical';
  /**
   * If true, when the group runs out of vertical or horizontal space, child
   * components will be wrapped, and start to be arranged on additional columns
   * or rows.
   */
  wrap?: boolean;
  /**
   * If true, this group will have the same colour background as its parent, and
   * no border. This allows you to use groups to arrange components without
   * having to have visible boundaries between them.
   */
  noBorder?: boolean;
}

/**
 * Default [[GroupComponentStyle]] for the [[Group]] component.
 */
export const GROUP_DEFAULT_STYLE: GroupComponentStyle = {
  direction: 'horizontal'
};

/**
 * Styling options for the [[Label]] component
 *
 * Default Styling: [[LABEL_DEFAULT_STYLE]]
 */
export interface LabelComponentStyle {
  /**
   * If true, make the text of this label bold
   */
  bold?: boolean;
}

/**
 * Default [[LabelComponentStyle]] for the [[Label]] component.
 */
export const LABEL_DEFAULT_STYLE: LabelComponentStyle = {
  bold: false
};

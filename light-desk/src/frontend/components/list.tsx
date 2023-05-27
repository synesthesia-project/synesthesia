
interface Props {
  className?: string;
  info: proto.GroupComponent;
}

const List: React.FunctionComponent<Props> = (props) => {
  const { renderComponent } = React.useContext(StageContext);
  const color = React.useContext(LastGroupColor);

  return (
    <div
      className={calculateClass(
        props.className,
        props.info.style.noBorder && 'no-border',
        `color-${color}`
      )}
    >
      {props.info.title ? (
        <div className="title">{props.info.title}</div>
      ) : null}
      <div className="children">
        <LastGroupColor.Provider value={nextColor(color, props)}>
          {props.info.children.map(renderComponent)}
        </LastGroupColor.Provider>
      </div>
    </div>
  );
  );
};
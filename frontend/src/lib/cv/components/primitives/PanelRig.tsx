export function PanelRig() {
  return (
    <div className="rig">
      <div className="lift">
        <span className="chain" />
        <span className="hook" />
      </div>
      <div className="lift">
        <span className="chain" />
        <span className="hook" />
      </div>
    </div>
  );
}

export function PanelAnchors() {
  return (
    <div className="panel-anchors" aria-hidden="true">
      <span className="anchor" />
      <span className="anchor" />
    </div>
  );
}

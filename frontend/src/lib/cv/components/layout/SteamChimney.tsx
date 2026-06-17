export function SteamChimney() {
  return (
    <aside className="steam-chimney" aria-hidden="true">
      <div className="chimney-body">
        <div className="chimney-trim" />
        <div className="chimney-heat" />

        <div className="chimney-pipes">
          <span className="cpipe cpipe-left" />
          <span className="cpipe-flange flange-left" />
          <div className="pipe-gauge">
            <span className="cpipe cpipe-gauge-in" />
            <div className="pipe-gauge-dial" style={{ ['--p' as string]: '62%' }}>
              <span className="pipe-gauge-needle" />
              <span className="pipe-gauge-val">6.2</span>
              <span className="pipe-gauge-unit">bar</span>
            </div>
            <span className="cpipe cpipe-gauge-out" />
            <span className="cpipe-flange flange-gauge" />
          </div>
          <span className="cpipe cpipe-down" />
          <span className="cpipe-flange flange-exit" />
        </div>

        <div className="chimney-stack">
          <span className="chimney-band band-top" />
          <span className="chimney-band band-mid" />
          <span className="chimney-band band-low" />
          <span className="chimney-rivet rivet-l" />
          <span className="chimney-rivet rivet-r" />
          <span className="chimney-rivet rivet-l" />
          <span className="chimney-rivet rivet-r" />
          <span className="chimney-rivet rivet-l" />
          <span className="chimney-rivet rivet-r" />
          <span className="chimney-rivet rivet-l" />
          <span className="chimney-rivet rivet-r" />
          <span className="chimney-soot" />
        </div>

        <div className="chimney-cap">
          <span className="chimney-cowl" />
          <div className="chimney-mouth">
            <span className="chimney-ember e1" />
            <span className="chimney-ember e2" />
            <span className="chimney-ember e3" />
          </div>
        </div>

        <div className="chimney-steam">
          <span className="steam-wisp w1" />
          <span className="steam-wisp w2" />
          <span className="steam-wisp w3" />
          <span className="steam-wisp w4" />
          <span className="steam-wisp w5" />
          <span className="steam-wisp w6" />
          <span className="steam-wisp w7" />
          <span className="steam-wisp w8" />
          <span className="steam-wisp w9" />
          <span className="steam-wisp w10" />
        </div>

        <div className="chimney-pedestal">
          <span className="chimney-plate">SECT. 12</span>
          <div className="chimney-base">
            <span className="lamp amber" />
            <span className="chimney-status">6.2 bar</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

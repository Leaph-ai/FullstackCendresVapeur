export function FooterBoiler() {
  return (
    <footer className="boiler" id="footer">
      <div className="steamfield" aria-hidden="true">
        <span className="steam" style={{ left: '16%' }} />
        <span
          className="steam"
          style={{ left: '46%', animationDelay: '2.4s', width: 92, height: 92 }}
        />
        <span
          className="steam"
          style={{ left: '76%', animationDelay: '4.6s', width: 60, height: 60 }}
        />
      </div>
      <div className="boiler-inner">
        <div>
          <div className="blogo">
            <b>CENDRES</b> &amp; VAPEUR
          </div>
          <p>
            Comptoir de troc &amp; registre de la colonie. Guilde de la zone franche, secteur 12.
            Déclaration d&apos;activité enregistrée — région Hauts-de-France.
          </p>
          <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
            <span className="lamp" />
            <span className="lamp amber" />
            <span className="lamp off" />
            <span className="lamp" />
          </div>
        </div>
        <div>
          <h3>Comptoir</h3>
          <a href="#vitrine">Vitrine</a>
          <a href="#">Panier</a>
          <a href="#">Bourse du cuivre</a>
          <a href="#">Mon établi</a>
        </div>
        <div>
          <h3>Colonie</h3>
          <a href="#journal">Journal des survivants</a>
          <a href="#toxicite">Moniteur de toxicité</a>
          <a href="#">Calendrier de rotation</a>
          <a href="#chiffres">Chiffres</a>
        </div>
        <div>
          <h3>Guilde</h3>
          <div className="secteurs">
            <a href="#">
              <span>
                <span className="lamp" /> Secteur Cobalt
              </span>
            </a>
            <a href="#">
              <span>
                <span className="lamp amber" /> Secteur Rouille
              </span>
            </a>
            <a href="#">
              <span>
                <span className="lamp" /> Secteur Pourpre
              </span>
            </a>
          </div>
          <a href="#" style={{ marginTop: 10 }}>
            Télégraphe · Bureau de poste
          </a>
        </div>
      </div>
      <div className="boiler-bar">
        <span>© Cycle 14 · Fév. 2026 — Guilde de la zone franche</span>
        <span>PRESSION : 6.2 BAR · AIR : NOMINAL · 4 SECTEURS EN LIGNE</span>
      </div>
    </footer>
  );
}

import { PanelAnchors } from '../primitives/PanelRig';
import { ScrollPanel } from '../primitives/ScrollPanel';

export function HeroSection() {
  return (
    <ScrollPanel id="accueil" animated={false} className="hero">
      <div className="crt">
        <div className="hero-grid">
          <div>
            <p className="hero-line">
              &gt; SESSION CITOYEN · Cobalt-114 &nbsp;··········&nbsp;{' '}
              <span className="ok">CONNECTÉ</span>
            </p>
            <h1>
              FORGEZ.
              <br />
              TROQUEZ.
              <br />
              <b>TENEZ LA PRESSION.</b>
            </h1>
            <p className="lead">
              Le comptoir de troc de la colonie. Des pièces sous pression, un cuivre qui fluctue à
              chaque échange, et l&apos;air qu&apos;on surveille au manomètre. Bienvenue en zone
              franche, technicien.
            </p>
            <div className="hero-cta">
              <a className="cv-btn" href="#vitrine">
                Entrer dans la vitrine
              </a>
              <a className="cv-btn is-ghost" href="#">
                Mon établi
              </a>
            </div>
          </div>
        </div>
        <div className="hero-marquee">
          <span>
            ⚙ SYSTÈME EN PRESSION — RÉACTEUR À VAPEUR STABLE — BOURSE DU CUIVRE OUVERTE — TÉLÉGRAPHE
            ACTIF — MONITEUR DE TOXICITÉ : SOUFRE NOMINAL — 4 SECTEURS EN LIGNE — &nbsp;&nbsp;&nbsp;
          </span>
          <span>
            ⚙ SYSTÈME EN PRESSION — RÉACTEUR À VAPEUR STABLE — BOURSE DU CUIVRE OUVERTE — TÉLÉGRAPHE
            ACTIF — MONITEUR DE TOXICITÉ : SOUFRE NOMINAL — 4 SECTEURS EN LIGNE — &nbsp;&nbsp;&nbsp;
          </span>
        </div>
      </div>
      <PanelAnchors />
    </ScrollPanel>
  );
}

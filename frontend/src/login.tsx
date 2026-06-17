import './login.css'

function Login() {
  return (
    <section className="login-page">
      <div className="login-container">

        <div className="login-header">
          <h1>CENDRES & VAPEUR</h1>
          <p>
            Authentification au réseau de la colonie
          </p>
        </div>

        <form className="login-form">

          <div className="form-group">
            <label htmlFor="email">
              Identifiant Citoyen
            </label>

            <input
              type="email"
              id="email"
              placeholder="citoyen@colonie.fr"
              aria-label="Adresse email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Clé d'accès
            </label>

            <input
              type="password"
              id="password"
              placeholder="********"
              aria-label="Mot de passe"
            />
          </div>

          <button type="submit">
            Ouvrir la Valve
          </button>

          <a href="#">
            Mot de passe oublié ?
          </a>

        </form>

        <div className="security-box">
          <h3>🔒 Transmission sécurisée</h3>
          <p>
            Certains secteurs nécessitent une
            double authentification (2FA).
          </p>
        </div>

      </div>
    </section>
  )
}

export default Login
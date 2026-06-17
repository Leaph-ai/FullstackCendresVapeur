import './register.css';

function Register() {
  return (
    <section className="register-page">
      <div className="register-container">

        <h1>Rejoindre la Colonie</h1>

        <p className="subtitle">
          Création d'un nouveau citoyen
        </p>

        <form className="register-form">

          <input
            type="text"
            placeholder="Nom complet"
          />

          <input
            type="email"
            placeholder="Adresse email"
          />

          <input
            type="password"
            placeholder="Mot de passe"
          />

          <input
            type="password"
            placeholder="Confirmation"
          />

          <button type="submit">
            S'enregistrer
          </button>

        </form>

      </div>
    </section>
  )
}

export default Register
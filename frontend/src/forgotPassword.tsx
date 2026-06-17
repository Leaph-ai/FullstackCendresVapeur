import './forgotPassword.css'

function ForgotPassword() {
  return (
    <section className="forgot-page">
      <div className="forgot-container">

        <h1>Mot de passe oublié</h1>

        <p>
          Un code de récupération sera envoyé.
        </p>

        <form className="forgot-form">

          <input
            type="email"
            placeholder="citoyen@colonie.fr"
          />

          <button type="submit">
            Envoyer
          </button>

        </form>

      </div>
    </section>
  )
}

export default ForgotPassword
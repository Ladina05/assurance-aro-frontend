"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { EnvelopeFill, ArrowLeft, CheckCircleFill } from "react-bootstrap-icons"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import { forgotPassword } from "../services/api"
import "./Auth.css"
import "../styles/animations.css"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      await forgotPassword(email)
      setEmailSent(true)
      addToast("Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.", "success")
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo">
                <div className="logo-circle">
                  <img src="/Aro.jpeg" alt="ARO IMMO" width={80} height={80} />
                </div>
              </div>
              <div className="success-icon animate-fade-in">
                <CheckCircleFill size={64} className="text-success" />
              </div>
              <h2 className="auth-title">Email envoyé !</h2>
              <p className="auth-subtitle">
                Si un compte avec l'email <strong>{email}</strong> existe, 
                vous recevrez un lien de réinitialisation.
              </p>
            </div>

            <div className="success-message animate-fade-in-up">
              <div className="success-info">
                <h4>📧 Vérifiez votre boîte email</h4>
                <p>Nous avons envoyé un lien de réinitialisation à votre adresse email.</p>
                
                <div className="security-notice">
                  <strong>💡 Conseil de sécurité :</strong>
                  <ul>
                    <li>Le lien expirera dans 1 heure</li>
                    <li>Ne partagez jamais ce lien avec personne</li>
                    <li>Si vous n'avez pas reçu l'email, vérifiez vos spams</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="auth-footer">
              <Link to="/login" className="btn btn-outline-primary w-100">
                <ArrowLeft size={16} className="me-2" />
                Retour à la connexion
              </Link>
              
              <p className="text-center mt-3">
                Vous n'avez pas reçu l'email ?{" "}
                <button 
                  type="button" 
                  className="auth-link" 
                  onClick={() => setEmailSent(false)}
                >
                  Réessayer
                </button>
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-circle">
                <img src="/Aro.jpeg" alt="ARO IMMO" width={80} height={80} />
              </div>
            </div>
            <h2 className="auth-title">Mot de passe oublié</h2>
            <p className="auth-subtitle">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                <EnvelopeFill size={16} className="me-2" />
                Adresse email
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <EnvelopeFill size={20} className="me-2" />
                  Envoyer le lien de réinitialisation
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              <ArrowLeft size={16} className="me-1" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
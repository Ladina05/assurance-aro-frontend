"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { LockFill, CheckCircleFill, XCircleFill, ArrowLeft } from "react-bootstrap-icons"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import { verifyResetToken, resetPassword } from "../services/api"
export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const { toasts, addToast, removeToast } = useToast()

  const token = searchParams.get('token')

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setTokenValid(false)
        setVerifying(false)
        addToast("Token de réinitialisation manquant", "error")
        return
      }

      try {
        const result = await verifyResetToken(token)
        setTokenValid(true)
        setUserEmail(result.email)
      } catch (err) {
        setTokenValid(false)
        addToast(err.message, "error")
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      addToast("Les mots de passe ne correspondent pas", "error")
      return
    }

    if (newPassword.length < 6) {
      addToast("Le mot de passe doit contenir au moins 6 caractères", "error")
      return
    }

    setLoading(true)

    try {
      await resetPassword(token, newPassword)
      addToast("Mot de passe réinitialisé avec succès !", "success")
      setTimeout(() => navigate("/login"), 2000)
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading-state">
            <div className="spinner-border text-primary" />
            <p>Vérification du lien de réinitialisation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="error-icon">
                <XCircleFill size={64} className="text-danger" />
              </div>
              <h2 className="auth-title">Lien invalide</h2>
              <p className="auth-subtitle">
                Ce lien de réinitialisation est invalide ou a expiré.
              </p>
            </div>

            <div className="error-message">
              <p>Veuillez demander un nouveau lien de réinitialisation.</p>
              
              <div className="security-notice">
                <strong>💡 Causes possibles :</strong>
                <ul>
                  <li>Le lien a expiré (valable 1 heure)</li>
                  <li>Le lien a déjà été utilisé</li>
                  <li>Le lien est incorrect</li>
                </ul>
              </div>
            </div>

            <div className="auth-footer">
              <Link to="/forgot-password" className="btn btn-primary w-100 mb-2">
                Demander un nouveau lien
              </Link>
              <Link to="/login" className="btn btn-outline-secondary w-100">
                <ArrowLeft size={16} className="me-2" />
                Retour à la connexion
              </Link>
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
                <img src="/Aro.jpeg" alt="ARO IMMO" width={180} height={130} />
              </div>
            </div>
            <div className="success-icon">
              <CheckCircleFill size={48} className="text-success" />
            </div>
            <h2 className="auth-title">Nouveau mot de passe</h2>
            <p className="auth-subtitle">
              Créez un nouveau mot de passe pour <strong>{userEmail}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                <LockFill size={16} className="me-2" />
                Nouveau mot de passe
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <small className="form-text text-muted">
                Minimum 6 caractères
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">
                <LockFill size={16} className="me-2" />
                Confirmer le mot de passe
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-success w-100 btn-lg" disabled={loading} style={{ background: "#0d9488" }}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Réinitialisation...
                </>
              ) : (
                <>
                  <CheckCircleFill size={20} className="me-2" />
                  Réinitialiser le mot de passe
                </>
              )}
            </button>
          </form>

          <div className="security-notice-card">
            <strong>🔒 Sécurité</strong>
            <p>Votre ancien mot de passe ne fonctionnera plus après cette réinitialisation.</p>
          </div>

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
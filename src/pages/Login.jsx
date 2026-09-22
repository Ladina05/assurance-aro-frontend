"use client"

import { useState, useContext } from "react"
import { useNavigate, Link } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import { EnvelopeFill, LockFill, BoxArrowInRight, PersonPlusFill, Eye, EyeSlash } from "react-bootstrap-icons"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
export default function Login() {
  const { login } = useContext(AuthContext)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toasts, addToast, removeToast } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (res.ok) {
        login(data.user, data.token)
        addToast("Connexion réussie !", "success")
        setTimeout(() => navigate("/"), 500)
      } else {
        addToast(data.message || "Erreur de connexion", "error")
      }
    } catch (err) {
      addToast("Impossible de se connecter au serveur", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-circl">
                <img src="/public/Aro.jpeg" alt="Aro" width={200} height={150} />
              </div>
            </div>
            <h2 className="auth-title">Bienvenue</h2>
            <p className="auth-subtitle">Connectez-vous à votre compte ARO IMMO</p>
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

            <div className="form-group">
              <label className="form-label">
                <LockFill size={16} className="me-2" />
                Mot de passe
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading} style={{ background: "#0d9488" }}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Connexion...
                </>
              ) : (
                <>
                  <BoxArrowInRight size={20} />
                  Se connecter
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Pas encore de compte ?{" "}
              <Link to="/register" className="auth-link">
                <PersonPlusFill size={16} className="me-1" />
                S'inscrire
              </Link>
            </p>
              <p>
                <Link to="/forgot-password" className="auth-link">
                  🔐 Mot de passe oublié ?
                </Link>
              </p>
          </div>
        </div>
      </div>
    </>
  )
}
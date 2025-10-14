"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  PersonFill,
  EnvelopeFill,
  LockFill,
  Eye,
  EyeSlash,
  PersonPlusFill,
  BoxArrowInRight,
} from "react-bootstrap-icons"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import "./Auth.css"
import "../styles/animations.css"

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      addToast("Veuillez remplir tous les champs", "warning")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      addToast("Les mots de passe ne correspondent pas", "error")
      return
    }
    if (formData.password.length < 6) {
      addToast("Le mot de passe doit contenir au moins 6 caractères", "warning")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        addToast("Inscription réussie ! Redirection...", "success")
        setTimeout(() => navigate("/login"), 1500)
      } else {
        addToast(data.message || "Erreur lors de l'inscription", "error")
      }
    } catch (err) {
      addToast("Impossible de contacter le serveur", "error")
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
              <div className="logo-circle">
                <PersonPlusFill size={32} />
              </div>
            </div>
            <h2 className="auth-title">Créer un compte</h2>
            <p className="auth-subtitle">Rejoignez Assurance ARO aujourd'hui</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                <PersonFill size={16} className="me-2" />
                Nom complet
              </label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Votre nom complet"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <EnvelopeFill size={16} className="me-2" />
                Adresse email
              </label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="exemple@email.com"
                value={formData.email}
                onChange={handleChange}
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
                  name="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <LockFill size={16} className="me-2" />
                Confirmer le mot de passe
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="form-control"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Inscription...
                </>
              ) : (
                <>
                  <PersonPlusFill size={20} />
                  S'inscrire
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Vous avez déjà un compte ?{" "}
              <Link to="/login" className="auth-link">
                <BoxArrowInRight size={16} className="me-1" />
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
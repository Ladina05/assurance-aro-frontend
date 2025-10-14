"use client"

import { useContext, useState } from "react"
import { AuthContext } from "../context/AuthContext"
import { PersonCircle, EnvelopeFill, BoxArrowRight, ShieldCheck } from "react-bootstrap-icons"
import ConfirmDialog from "../components/ConfirmDialog"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import "./Profile.css"
import "../styles/animations.css"

export default function Profile() {
  const { user, logout } = useContext(AuthContext)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  const handleLogout = () => {
    addToast("Déconnexion réussie", "success")
    setTimeout(() => {
      logout()
    }, 500)
  }

  if (!user)
    return (
      <div className="profile-loading">
        <div className="spinner-border text-success" />
        <p>Chargement...</p>
      </div>
    )

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog
        show={showLogoutConfirm}
        onHide={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirmer la déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Se déconnecter"
        cancelText="Annuler"
        variant="danger"
      />

      <div className="profile-container animate-fadeInUp">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <PersonCircle size={80} />
            </div>
            <h2 className="profile-name">{user.name}</h2>
            <div className="profile-badge">
              <ShieldCheck size={16} />
              <span>Compte vérifié</span>
            </div>
          </div>

          <div className="profile-info">
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <PersonCircle size={24} />
              </div>
              <div className="profile-info-content">
                <label>Nom complet</label>
                <p>{user.name}</p>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <EnvelopeFill size={24} />
              </div>
              <div className="profile-info-content">
                <label>Adresse email</label>
                <p>{user.email}</p>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-danger btn-lg w-100" onClick={() => setShowLogoutConfirm(true)}>
              <BoxArrowRight size={20} />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
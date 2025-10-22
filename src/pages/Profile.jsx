"use client"

import { useContext, useState } from "react"
import { AuthContext } from "../context/AuthContext"
import { PersonCircle, EnvelopeFill, BoxArrowRight, ShieldCheck } from "react-bootstrap-icons"
import ConfirmDialog from "../components/ConfirmDialog"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import "./Profile.css"
import "../styles/animations.css"
import { Modal, Form } from "react-bootstrap"

export default function Profile() {
  const { user, logout } = useContext(AuthContext)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loadingPwd, setLoadingPwd] = useState(false)
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      return addToast("Les nouveaux mots de passe ne correspondent pas", "danger")
    }
    setLoadingPwd(true)
    try {
      const token = localStorage.getItem("token") // ou depuis ton contexte Auth
      const res = await fetch("http://localhost:4000/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Erreur")

      addToast(data.message, "success")
      setShowChangePwd(false)
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      addToast(err.message, "danger")
    } finally {
      setLoadingPwd(false)
    }
  }

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

            <button className="btn btn-primary btn-lg w-100 mt-2" onClick={() => setShowChangePwd(true)}>
              <ShieldCheck size={20} /> Changer le mot de passe
            </button>
          </div>

          <div className="profile-actions">
            <button className="btn btn-danger btn-lg w-100" onClick={() => setShowLogoutConfirm(true)}>
              <BoxArrowRight size={20} />
              Se déconnecter
            </button>
          </div>

          <Modal show={showChangePwd} onHide={() => setShowChangePwd(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Changer le mot de passe</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Ancien mot de passe</Form.Label>
                  <Form.Control
                    type={showPwd ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Nouveau mot de passe</Form.Label>
                  <Form.Control
                    type={showPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
                  <Form.Control
                    type={showPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Afficher le mot de passe"
                    checked={showPwd}
                    onChange={() => setShowPwd(!showPwd)}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <button className="btn btn-secondary" onClick={() => setShowChangePwd(false)}>
                Annuler
              </button>
              <button className="btn btn-success" onClick={handleChangePassword} disabled={loadingPwd}>
                {loadingPwd ? "En cours..." : "Valider"}
              </button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </>
  )
}
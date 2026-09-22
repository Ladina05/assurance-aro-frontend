"use client"

import { useContext, useState } from "react"
import { AuthContext } from "../context/AuthContext"
import { PersonCircle, EnvelopeFill, BoxArrowRight, ShieldCheck, Camera } from "react-bootstrap-icons"
import ConfirmDialog from "../components/ConfirmDialog"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import { Modal, Form } from "react-bootstrap"
import { changePassword, uploadProfilePicture, deleteProfilePicture } from "../services/api"
import ProfilePictureModal from "../components/ProfilePictureModal"

export default function Profile() {
  const { user, logout, updateUser } = useContext(AuthContext)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loadingPwd, setLoadingPwd] = useState(false)

  const handleProfilePictureUpdate = async (profilePicture) => {
    try {
      if (profilePicture === null) {
        // Supprimer la photo
        const response = await deleteProfilePicture();
        updateUser(response.user);
        addToast("Photo de profil supprimée avec succès", "success");
      } else {
        // Uploader nouvelle photo
        const response = await uploadProfilePicture(profilePicture);
        updateUser(response.user);
        addToast("Photo de profil mise à jour avec succès", "success");
      }
    } catch (err) {
      addToast(err.message, "error");
      throw err;
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return addToast("Veuillez remplir tous les champs", "error")
    }

    if (newPassword !== confirmPassword) {
      return addToast("Les nouveaux mots de passe ne correspondent pas", "error")
    }

    if (newPassword.length < 6) {
      return addToast("Le mot de passe doit contenir au moins 6 caractères", "warning")
    }

    setLoadingPwd(true)
    try {
      await changePassword(oldPassword, newPassword)
      addToast("Mot de passe changé avec succès", "success")
      setShowChangePwd(false)
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      addToast(err.message, "error")
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

      <ProfilePictureModal
        show={showProfilePictureModal}
        onHide={() => setShowProfilePictureModal(false)}
        user={user}
        onUpdate={handleProfilePictureUpdate}
      />

      <div className="profile-container animate-fadeInUp">
        <div className="profile-card">
          <div className="profile-header">
            <div
              className="profile-avatar cursor-pointer"
              onClick={() => setShowProfilePictureModal(true)}
              style={{ position: 'relative', cursor: 'pointer' }}
            >
              {user.profilePicture ? (
                <>
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="rounded-circle"
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      border: '3px solid white'
                    }}
                  />
                  <div
                    className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-1"
                    style={{ transform: 'translate(25%, 25%)' }}
                  >
                    <Camera size={16} className="text-white" />
                  </div>
                </>
              ) : (
                <>
                  <PersonCircle size={80} />
                  <div
                    className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-1"
                    style={{ transform: 'translate(25%, 25%)' }}
                  >
                    <Camera size={16} className="text-white" />
                  </div>
                </>
              )}
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

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <ShieldCheck size={24} />
              </div>
              <div className="profile-info-content">
                <label>Rôle</label>
                <p className="text-capitalize">{user.role?.toLowerCase()}</p>
              </div>
            </div>

            <button className="btn btn-primary btn-lg w-100 mt-2" onClick={() => setShowChangePwd(true)}
              style={{ background: "linear-gradient(135deg, #22c55e 0%, #0790bdff 100%)" }}
            >
              <ShieldCheck size={20} /> Changer le mot de passe
            </button>
          </div>

          <div className="profile-actions">
            <button className="btn btn-danger btn-lg w-100" onClick={() => setShowLogoutConfirm(true)}>
              <BoxArrowRight size={20} />
              Se déconnecter
            </button>
          </div>

          <Modal show={showChangePwd} onHide={() => setShowChangePwd(false)} centered >
            <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #12c654ff 0%, #0790bdff 100%)" }}>
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
                    placeholder="Entrez votre ancien mot de passe"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Nouveau mot de passe</Form.Label>
                  <Form.Control
                    type={showPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Entrez votre nouveau mot de passe"
                  />
                  <Form.Text className="text-muted">
                    Le mot de passe doit contenir au moins 6 caractères.
                  </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
                  <Form.Control
                    type={showPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez votre nouveau mot de passe"
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
              <button className="btn btn-success" onClick={handleChangePassword} disabled={loadingPwd} style={{ background: "linear-gradient(135deg, #22c55e 0%, #0790bdff 100%)" }}>
                {loadingPwd ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Modification...
                  </>
                ) : (
                  "Valider"
                )}
              </button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </>
  )
}
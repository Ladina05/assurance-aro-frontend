"use client"

import { useContext, useState } from "react"
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom"
import { AuthContext } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Home from "./pages/Home"
import AllCompteurs from "./pages/AllCompteurs"
import Loues from "./pages/Loues"
import NonLoues from "./pages/NonLoues"
import Historique from "./pages/Historique"
import BatchDetails from "./pages/BatchDetails"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import Evolution from "./pages/Evolution"
import { HouseFill, Grid3x3GapFill, HouseSlashFill, ClockHistory, PersonCircle, Camera, BarChart } from "react-bootstrap-icons"
import ProfilePictureModal from "./components/ProfilePictureModal"
import { uploadProfilePicture, deleteProfilePicture } from "./services/api"
import { useToast } from "./hooks/useToast"
import ToastContainer from "./components/ToastContainer"
import "./App.css"

export default function App() {
  const { user, loading, updateUser } = useContext(AuthContext)
  const location = useLocation()
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

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

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-border text-success" />
        <p>Chargement...</p>
      </div>
    )
  }

  const navItems = [
    { path: "/", label: "Accueil", icon: <HouseFill size={20} /> },
    { path: "/all-compteurs", label: "Tous", icon: <Grid3x3GapFill size={20} /> },
    { path: "/loues", label: "Loués", icon: <HouseFill size={20} /> },
    { path: "/non-loues", label: "Libres", icon: <HouseSlashFill size={20} /> },
    { path: "/historique", label: "Historique", icon: <ClockHistory size={20} /> },
    { path: "/evolution", label: "Évolution", icon: <BarChart size={20} /> },
  ]

  return (
    <div className="app-wrapper">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <ProfilePictureModal
        show={showProfilePictureModal}
        onHide={() => setShowProfilePictureModal(false)}
        user={user}
        onUpdate={handleProfilePictureUpdate}
      />

      {user && (
        <>
          <header className="app-header">
            <div className="header-container">
              <div className="header-brand">
                <div className="brand-logo">
                  <img src="/Aro.jpeg" alt="Logo Aro" width={100} height={80} />
                </div>
                <br />
                <div className="brand-text">
                  <h1 className="brand-title">GESTION DES COMPTEURS</h1>
                </div>
              </div>

              <nav className="header-nav">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="header-profile-section">
                <div>
                  <Link to="/profile" className="header-profile-link">
                    {user.profilePicture ? (
                      <div className="profile-image-container">
                        <img
                          src={user.profilePicture}
                          alt="Profile"
                          className="profile-image"
                        />
                        <div className="profile-edit-overlay">
                          <Camera size={14} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="profile-icon-container">
                        <PersonCircle size={32} className="profile-icon" />
                        <div className="profile-edit-overlay">
                          <Camera size={14} className="text-white" />
                        </div>
                      </div>
                    )}
                  </Link>
                </div>
                <Link to="/profile" className="header-profile-link">
                  <span className="profile-name">{user.name}</span>
                  <span className="profile-role">{user.role?.toLowerCase()}</span>
                </Link>
              </div>
            </div>
          </header>

          <nav className="mobile-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${location.pathname === item.path ? "active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <Link to="/profile" className={`mobile-nav-link ${location.pathname === "/profile" ? "active" : ""}`}>
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="mobile-profile-image"
                />
              ) : (
                <PersonCircle size={20} />
              )}
              <span>Profil</span>
            </Link>
          </nav>
        </>
      )}

      <main className={user ? "app-main" : "app-main-full"}>
        <Routes>
          {/* Routes publiques */}
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" replace />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/" replace />}
          />

          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" replace />} />
          <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/" replace />} />

          {/* Routes protégées */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/all-compteurs"
            element={
              <ProtectedRoute>
                <AllCompteurs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loues"
            element={
              <ProtectedRoute>
                <Loues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/non-loues"
            element={
              <ProtectedRoute>
                <NonLoues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historique"
            element={
              <ProtectedRoute>
                <Historique />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historique/:id"
            element={
              <ProtectedRoute>
                <BatchDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evolution"
            element={
              <ProtectedRoute>
                <Evolution />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Route par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
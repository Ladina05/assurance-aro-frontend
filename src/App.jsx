"use client"

import { useContext } from "react"
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
import { HouseFill, Grid3x3GapFill, HouseSlashFill, ClockHistory, PersonCircle } from "react-bootstrap-icons"
import "./App.css"

export default function App() {
  const { user, loading } = useContext(AuthContext)
  const location = useLocation()

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
  ]

  return (
    <div className="app-wrapper">
      {user && (
        <>
          <header className="app-header">
            <div className="header-container">
              <div className="header-brand">
                <div className="brand-logo">
                  <img src="/Aro.jpeg" alt="Logo Aro" width={80} height={80} />
                </div>
                <div className="brand-text">
                  <h1 className="brand-title">ARO IMMO</h1>
                  <p className="brand-subtitle">Gestion des compteurs</p>
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

              <Link to="/profile" className="header-profile">
                <PersonCircle size={32} />
              </Link>
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
              <PersonCircle size={20} />
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
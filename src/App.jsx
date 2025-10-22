"use client"

import { useContext } from "react"
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom"
import { AuthContext } from "./context/AuthContext"
import Home from "./pages/Home"
import AllCompteurs from "./pages/AllCompteurs"
import Loues from "./pages/Loues"
import NonLoues from "./pages/NonLoues"
import Historique from "./pages/Historique"
import BatchDetails from "./pages/BatchDetails"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import { HouseFill, Grid3x3GapFill, HouseSlashFill, ClockHistory, PersonCircle } from "react-bootstrap-icons"
import "./App.css"

function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext)

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner-border text-success" />
        <p>Chargement...</p>
      </div>
    )

  return user ? children : <Navigate to="/login" />
}

export default function App() {
  const { user, loading } = useContext(AuthContext)
  const location = useLocation()

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner-border text-success" />
        <p>Chargement...</p>
      </div>
    )

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
                <div className="brand-log">
                  <img src="/public/Aro.jpeg" alt="Logo Aro" width={80} height={80} />
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
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/all-compteurs"
            element={
              <PrivateRoute>
                <AllCompteurs />
              </PrivateRoute>
            }
          />
          <Route
            path="/loues"
            element={
              <PrivateRoute>
                <Loues />
              </PrivateRoute>
            }
          />
          <Route
            path="/non-loues"
            element={
              <PrivateRoute>
                <NonLoues />
              </PrivateRoute>
            }
          />
          <Route
            path="/historique"
            element={
              <PrivateRoute>
                <Historique />
              </PrivateRoute>
            }
          />
          <Route
            path="/historique/:id"
            element={
              <PrivateRoute>
                <BatchDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
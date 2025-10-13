import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import AllCompteurs from './pages/AllCompteurs';
import Loues from './pages/Loues';
import NonLoues from './pages/NonLoues';
import Historique from './pages/Historique';
import BatchDetails from './pages/BatchDetails';

export default function App() {
  return (
    <div className="container mt-4">
      <h1 className="mb-3">Assurance Aro — Gestion des Compteurs</h1>

      {/* --- Navigation --- */}
      <nav className="mb-3">
        <Link className="me-3" to="/">Accueil</Link>
        <Link className="me-3" to="/all-compteurs">Tous les compteurs</Link>
        <Link className="me-3" to="/loues">Loués</Link>
        <Link className="me-3" to="/non-loues">Non loués</Link>
        <Link className="me-3" to="/historique">Historique</Link>
      </nav>

      <hr />

      {/* --- Routes --- */}
      <Routes>
        <Route path="/" element={<Home />} />                 {/* Page d’accueil */}
        <Route path="/all-compteurs" element={<AllCompteurs />} />
        <Route path="/loues" element={<Loues />} />
        <Route path="/non-loues" element={<NonLoues />} />
        <Route path="/historique" element={<Historique />} />
        <Route path="/historique/:id" element={<BatchDetails />} />
      </Routes>
    </div>
  );
}

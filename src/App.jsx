import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AllCompteurs from './pages/AllCompteurs';
import Loues from './pages/Loues';
import NonLoues from './pages/NonLoues';
import Historique from './pages/Historique';
import BatchDetails from './pages/BatchDetails';

export default function App() {
  return (
    <div className="container">
      <h1>Assurance Aro — Gestion Compteurs</h1>
      <nav>
        <Link to="/">Tous</Link>
        <Link to="/louis">Loués</Link>
        <Link to="/non-loues">Non loués</Link>
        <Link to="/historique">Historique</Link>
      </nav>

      <hr />

      <Routes>
        <Route path="/" element={<AllCompteurs />} />
        <Route path="/louis" element={<Loues />} />
        <Route path="/non-loues" element={<NonLoues />} />
        <Route path="/historique" element={<Historique />} />
        <Route path="/historique/:id" element={<BatchDetails />} />
      </Routes>
    </div>
  );
}

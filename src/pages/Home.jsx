import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container mt-4">
      <h1>Bienvenue sur Assurance Aro</h1>
      <p>Choisissez une section pour commencer :</p>

      <div className="d-grid gap-2 col-6 mx-auto mt-4">
        <Link to="/all-compteurs" className="btn btn-primary btn-lg">Tous les compteurs</Link>
        <Link to="/loues" className="btn btn-success btn-lg">Compteurs loués</Link>
        <Link to="/non-loues" className="btn btn-warning btn-lg">Compteurs non loués</Link>
      </div>
    </div>
  );
}

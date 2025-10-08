import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBatchDetails } from '../services/api';

export default function BatchDetails() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  async function downloadBatchPdf() {
    try {
      const res = await fetch(`${API_BASE}/payment-batches/${id}/pdf`);
      if (!res.ok) throw new Error('Erreur lors de la génération du PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paiement_batch_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await getBatchDetails(id);
        setBatch(data);
      } catch (err) { alert(err.message); }
    }
    load();
  }, [id]);

  if (!batch) return <div>Chargement...</div>;

  return (
    <div className="container mt-3">
      <h2>Détails du paiement #{batch.id}</h2>
      <p><strong>Date :</strong> {new Date(batch.date).toLocaleString()}</p>
      <p><strong>Total :</strong> {batch.total.toLocaleString()} Ar</p>

      <div className="mb-3">
        <button onClick={downloadBatchPdf} className="btn btn-primary me-2">🖨️ Imprimer le reçu PDF</button>
        <Link to="/historique" className="btn btn-outline-secondary">Retour historique</Link>
      </div>

      <h3>Liste des paiements</h3>
      <table className="table">
        <thead>
          <tr>
            <th>ID Payment</th><th>Code Immeuble</th><th>Propriété</th><th>RG</th><th>Type Bien</th><th>Province</th>
            <th>Adresse</th><th>Quartier</th><th>Localisation</th><th>N°Compteur</th>
            <th>Montant</th><th>N° Facture</th>
          </tr>
        </thead>
        <tbody>
          {batch.payments.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.compteur?.codeImmeuble ?? '-'}</td>
              <td>{p.compteur?.nomPropriete ?? '-'}</td>
              <td>{p.compteur?.rg ?? '-'}</td>
              <td>{p.compteur?.typeBien ?? '-'}</td>
              <td>{p.compteur?.province ?? '-'}</td>
              <td>{p.compteur?.adresse ?? '-'}</td>
              <td>{p.compteur?.quartier ?? '-'}</td>
              <td>{p.compteur?.localisation ?? '-'}</td>
              <td>{p.numeroCompteur ?? '-'}</td>
              <td>{p.montant?.toLocaleString()} Ar</td>
              <td>{p.numeroFacture ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
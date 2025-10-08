import React, { useEffect, useState } from 'react';
import { getBatches } from '../services/api';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function downloadBatchPdf(batchId) {
  const res = await fetch(`${API_BASE}/payment-batches/${batchId}/pdf`);
  if (!res.ok) throw new Error('Erreur génération PDF');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `paiement_batch_${batchId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function Historique() {
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBatches();
        setBatches(data);
      } catch (err) {
        alert(err.message);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h2>Historique des paiements mensuels</h2>
      <table className="table">
        <thead><tr><th>ID</th><th>Date</th><th>Total</th><th>Actions</th></tr></thead>
        <tbody>
          {batches.map(b => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{new Date(b.date).toLocaleString()}</td>
              <td>{b.total}</td>
              <td><Link to={`/historique/${b.id}`} className="btn btn-outline">Voir</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { getCompteurs } from '../services/api';

export default function Loues() {
  const [compteurs, setCompteurs] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCompteurs(true); // loués
        setCompteurs(data);
      } catch (err) { alert(err.message); }
    }
    load();
  }, []);

  return (
    <div>
      <h2>Compteurs loués</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th><th>Code Immeuble</th><th>Propriété</th><th>RG</th><th>Type Bien</th><th>Province</th>
            <th>Adresse</th><th>Quartier</th><th>Localisation</th><th>N°Compteur</th>
            <th>N° Facture</th><th>Montant</th>
          </tr>
        </thead>
        <tbody>
          {compteurs.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.codeImmeuble}</td>
              <td>{c.nomPropriete}</td>
              <td>{c.rg}</td>
              <td>{c.typeBien}</td>
              <td>{c.province}</td>
              <td>{c.adresse}</td>
              <td>{c.quartier}</td>
              <td>{c.localisation}</td>
              <td>{c.numeroCompteur}</td>
              <td>{c.numeroFacture ?? '-'}</td>
              <td>{c.montant ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

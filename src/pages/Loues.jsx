import React, { useEffect, useState } from 'react';
import { getCompteurs } from '../services/api';

export default function Loues() {
  const [compteurs, setCompteurs] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getCompteurs(true); // loués
        setCompteurs(data);
      } catch (err) {
        alert(err.message);
      }
    }
    load();
  }, []);

  // Filtrage par recherche
  const filteredCompteurs = compteurs.filter(c => {
    const text = searchText.toLowerCase();
    const mainFields = [
      c.codeImmeuble, c.nomPropriete, c.rg, c.typeBien,
      c.province, c.adresse, c.quartier, c.localisation
    ];
    const mainMatch = mainFields.some(f => f?.toLowerCase().includes(text));
    const sousMatch = c.sousCompteurs?.some(s => s.numeroCompteur.toLowerCase().includes(text));
    return mainMatch || sousMatch;
  });

  return (
    <div>
      <h2>Compteurs loués</h2>

      {/* Barre de recherche */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="form-control"
        />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Code Immeuble</th>
            <th>Propriété</th>
            <th>RG</th>
            <th>Type Bien</th>
            <th>Province</th>
            <th>Adresse</th>
            <th>Quartier</th>
            <th>Localisation</th>
            <th>N° Compteurs</th>
          </tr>
        </thead>
        <tbody>
          {filteredCompteurs.map(c => (
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
              <td>
                {c.sousCompteurs && c.sousCompteurs.length > 0 ? (
                  c.sousCompteurs.map(s => (
                    <span key={s.id} style={{ display: 'inline-block', marginRight: '10px' }}>
                      {s.numeroCompteur}
                    </span>
                  ))
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

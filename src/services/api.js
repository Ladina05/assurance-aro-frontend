// Petit wrapper fetch pour appeler le backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function getCompteurs(loue) {
  const url = new URL(`${API_BASE}/compteurs`);
  if (loue !== undefined) url.searchParams.set('loue', loue ? 'true' : 'false');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Erreur fetch compteurs');
  return res.json();
}

export async function createCompteur(payload) {
  const res = await fetch(`${API_BASE}/compteurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur création compteur');
  return res.json();
}

export async function updateCompteur(id, payload) {
  const res = await fetch(`${API_BASE}/compteurs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur maj compteur');
  return res.json();
}

// ⚡ CRUD Sous-compteurs
export async function createSousCompteur(payload) {
  const res = await fetch(`${API_BASE}/souscompteurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur création sous-compteur');
  return res.json();
}

export async function updateSousCompteur(id, payload) {
  const res = await fetch(`${API_BASE}/souscompteurs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Erreur mise à jour sous-compteur');
  }
  return res.json();
}

// Supprimer un compteur
export async function deleteCompteur(id) {
  const res = await fetch(`${API_BASE}/compteurs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur suppression compteur');
  return res.json();
}

// Paiement
export async function payBatch(compteurs = []) {
  const ids = compteurs.map(c => c.id);
  const res = await fetch(`${API_BASE}/payment-batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ compteurIds: ids })
  });
  if (!res.ok) {
    const text = await res.json();
    throw new Error(text?.message || 'Erreur paiement');
  }
  return res.json();
}

// Historique
export async function getBatches() {
  const res = await fetch(`${API_BASE}/payment-batches`);
  if (!res.ok) throw new Error('Erreur fetch batches');
  return res.json();
}

export async function getBatchDetails(id) {
  const res = await fetch(`${API_BASE}/payment-batches/${id}`);
  if (!res.ok) throw new Error('Erreur fetch batch details');
  return res.json();
}

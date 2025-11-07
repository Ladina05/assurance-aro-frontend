// Petit wrapper fetch pour appeler le backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Fonction utilitaire pour récupérer le token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Fonction utilitaire pour les requêtes authentifiées
const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Ajouter le token d'authentification si disponible
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token invalide ou expiré - déconnexion automatique
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
    
    const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
    throw new Error(errorData.message || `Erreur ${response.status}`);
  }

  return response.json();
};

export async function getCompteurs(loue) {
  const url = new URL(`${API_BASE}/compteurs`);
  if (loue !== undefined) url.searchParams.set('loue', loue ? 'true' : 'false');
  
  return authFetch(url.toString());
}

export async function createCompteur(payload) {
  return authFetch(`${API_BASE}/compteurs`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateCompteur(id, payload) {
  return authFetch(`${API_BASE}/compteurs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

// ⚡ CRUD Sous-compteurs
export async function createSousCompteur(payload) {
  return authFetch(`${API_BASE}/souscompteurs`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateSousCompteur(id, payload) {
  return authFetch(`${API_BASE}/souscompteurs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

// Supprimer un compteur
export async function deleteCompteur(id) {
  return authFetch(`${API_BASE}/compteurs/${id}`, { 
    method: 'DELETE' 
  });
}

// Paiement
export async function payBatch(moisPaiement, anneePaiement) {
  return authFetch(`${API_BASE}/payment-batches`, {
    method: 'POST',
    body: JSON.stringify({ 
      moisPaiement: moisPaiement || new Date().getMonth() + 1,
      anneePaiement: anneePaiement || new Date().getFullYear()
    })
  });
}

// Historique
export async function getBatches() {
  return authFetch(`${API_BASE}/payment-batches`);
}

export async function getBatchDetails(id) {
  return authFetch(`${API_BASE}/payment-batches/${id}`);
}

// Téléchargement PDF du batch
export async function downloadBatchPdf(batchId) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/payment-batches/${batchId}/pdf`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Erreur téléchargement PDF');
  }
  return response.blob();
}

// Téléchargement chèque
export async function downloadCheque(batchId) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/payment-batches/${batchId}/cheque`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Erreur téléchargement chèque');
  }
  return response.blob();
}

// Téléchargement reçu
export async function downloadRecu(batchId) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/payment-batches/${batchId}/recu`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Erreur téléchargement reçu');
  }
  return response.blob();
}

// Upload chèque
export async function uploadCheque(batchId, file) {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('cheque', file);

  const response = await fetch(`${API_BASE}/payment-batches/${batchId}/cheque`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Erreur upload chèque');
  }
  return response.json();
}

// Upload reçu
export async function uploadRecu(batchId, file) {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('recu', file);

  const response = await fetch(`${API_BASE}/payment-batches/${batchId}/recu`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Erreur upload reçu');
  }
  return response.json();
}

// Suppression chèque
export async function deleteCheque(batchId) {
  return authFetch(`${API_BASE}/payment-batches/${batchId}/cheque`, {
    method: 'DELETE'
  });
}

// Suppression reçu
export async function deleteRecu(batchId) {
  return authFetch(`${API_BASE}/payment-batches/${batchId}/recu`, {
    method: 'DELETE'
  });
}

// Auth services
export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erreur de connexion');
  }

  return response.json();
}

export async function registerUser(userData) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erreur d\'inscription');
  }

  return response.json();
}

export async function getProfile() {
  return authFetch(`${API_BASE}/auth/profile`);
}

export async function changePassword(oldPassword, newPassword) {
  return authFetch(`${API_BASE}/auth/change-password`, {
    method: 'PUT',
    body: JSON.stringify({ oldPassword, newPassword })
  });
}

// Suppression batch
export async function deleteBatch(batchId) {
  return authFetch(`${API_BASE}/payment-batches/${batchId}`, {
    method: 'DELETE'
  });
}

// Mot de passe oublié
export async function forgotPassword(email) {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erreur lors de la demande de réinitialisation');
  }

  return response.json();
}

// Réinitialisation du mot de passe
export async function resetPassword(token, newPassword) {
  return authFetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ token, newPassword })
  });
}

// Vérification du token
export async function verifyResetToken(token) {
  const response = await fetch(`${API_BASE}/auth/verify-reset-token/${token}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Token invalide');
  }

  return response.json();
}
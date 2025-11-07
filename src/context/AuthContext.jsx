import React, { createContext, useState, useEffect } from 'react';
import { getProfile } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        // Vérifier que le token est toujours valide
        const userData = await getProfile();
        setUser(userData);
      } catch (error) {
        console.error('Token invalide ou expiré:', error);
        logout();
      }
    }
    setLoading(false);
  };

const login = async (userData, token) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  setUser(userData);
};

// Ajoutez cette fonction pour mettre à jour l'utilisateur
const updateUser = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
  setUser(userData);
};

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Rediriger vers la page de login
    window.location.href = '/login';
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  const hasAnyRole = (roles) => {
    return user && roles.includes(user.role);
  };

  // Vérifier les permissions
  const canCreate = () => hasAnyRole(['ADMIN', 'INSERTEUR']);
  const canEdit = () => hasAnyRole(['ADMIN', 'INSERTEUR']);
  const canDelete = () => hasRole('ADMIN');
  const canView = () => user !== null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      updateUser,
      hasRole,
      hasAnyRole,
      canCreate,
      canEdit,
      canDelete,
      canView
    }}>
      {children}
    </AuthContext.Provider>
  );
};
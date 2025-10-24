import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier les rôles si spécifiés
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>🚫 Accès Refusé</h4>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <p className="text-muted">Rôle requis: {requiredRoles.join(' ou ')}</p>
          <p className="text-muted">Votre rôle: {user.role}</p>
          <a href="/" className="btn btn-primary mt-3">Retour à l'accueil</a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
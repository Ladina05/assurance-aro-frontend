import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // ✅ Import du provider
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Sélection de la racine de l'application
const rootElement = document.getElementById('root');

// Vérification que l'élément existe
if (!rootElement) {
  throw new Error("Élément racine introuvable : vérifie que ton index.html contient <div id='root'></div>");
}

// Création de la racine React et rendu de l'application
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* ✅ On englobe App avec AuthProvider */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

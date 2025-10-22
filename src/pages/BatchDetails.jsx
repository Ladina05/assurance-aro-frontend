"use client"

import { useRef } from "react"
import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getBatchDetails } from "../services/api"
import { ArrowLeft, FileEarmarkPdfFill, CalendarEvent, CashStack, Search, XCircleFill, Filter } from "react-bootstrap-icons"
import { Button } from "react-bootstrap"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import "../styles/animations.css"

export default function BatchDetails() {
  const { id } = useParams()
  const [batch, setBatch] = useState({ payments: [] })
  const [loading, setLoading] = useState(false)
  const [showDeleteModalcheque, setShowDeleteModalcheque] = useState(false)
  const [showDeleteModalrecu, setShowDeleteModalrecu] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const [searchText, setSearchText] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    codeImmeuble: "",
    province: "",
    quartier: "",
    nomPropriete: "",
    rg: "",
    adresse: "",
    localisation: "",
    typeCompteur: "",
    numeroCompteur: "",
    numeroFacture: "",
    montant: ""
  })

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api"

  const formatMontantFR = (montant) => {
    if (montant == null) return "-"
    return montant.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const chequeInputRef = useRef(null)
  const recuInputRef = useRef(null)

  const fetchBatchDetails = async () => {
    try {
      const data = await getBatchDetails(id)
      setBatch(data)
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleUploadCheque = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("cheque", file)

    try {
      const res = await fetch(`${API_BASE}/payment-batches/${id}/cheque`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Erreur upload chèque")
      await fetchBatchDetails()
      addToast("Chèque ajouté avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleUploadRecu = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("recu", file)

    try {
      const res = await fetch(`${API_BASE}/payment-batches/${id}/recu`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Erreur upload reçu")
      await fetchBatchDetails()
      addToast("Reçu ajouté avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleDownloadCheque = async () => {
    try {
      const res = await fetch(`${API_BASE}/payment-batches/${id}/cheque`)
      if (!res.ok) throw new Error("Chèque non disponible")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = batch.chequePdf
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleDownloadRecu = async () => {
    try {
      const res = await fetch(`${API_BASE}/payment-batches/${id}/recu`)
      if (!res.ok) throw new Error("Reçu non disponible")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = batch.recuPdf
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleDeleteCheque = async () => {
    setShowDeleteModalcheque(true)
  }

  const handleDeleteRecu = async () => {
    setShowDeleteModalrecu(true)
  }

  const confirmDeleteCheque = async () => {
    try {
      const res = await fetch(`${API_BASE}/payment-batches/${id}/cheque`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erreur suppression chèque")
      await fetchBatchDetails()
      addToast("Chèque supprimé", "success")
      setShowDeleteModalcheque(false)
    } catch (err) {
      addToast(err.message, "error")
      setShowDeleteModalcheque(false)
    }
  }

  const confirmDeleteRecu = async () => {
    try {
      const res = await fetch(`${API_BASE}/payment-batches/${id}/recu`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erreur suppression reçu")
      await fetchBatchDetails()
      addToast("Reçu supprimé", "success")
      setShowDeleteModalrecu(false)
    } catch (err) {
      addToast(err.message, "error")
      setShowDeleteModalrecu(false)
    }
  }

  const cancelDeleteCheque = () => {
    setShowDeleteModalcheque(false)
  }

  const cancelDeleteRecu = () => {
    setShowDeleteModalrecu(false)
  }

  // Gestion des filtres individuels
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      codeImmeuble: "",
      province: "",
      quartier: "",
      nomPropriete: "",
      rg: "",
      adresse: "",
      localisation: "",
      typeCompteur: "",
      numeroCompteur: "",
      numeroFacture: "",
      montant: ""
    })
  }

  const groupedPayments = Object.values(
    (batch.payments ?? []).reduce((acc, p) => {
      const key = p.numeroFacture ?? `nofacture-${p.id}` // clé unique si pas de facture
      if (!acc[key]) {
        acc[key] = {
          ...p,
          typeCompteur: [p.typeCompteur],
          numeroCompteur: [p.numeroCompteur],
          montant: p.montant ?? 0,
        }
      } else {
        acc[key].typeCompteur.push(p.typeCompteur)
        acc[key].numeroCompteur.push(p.numeroCompteur)
        acc[key].montant += p.montant ?? 0
      }
      return acc
    }, {}),
  )

  // Filtrage combiné (recherche globale + filtres individuels)
  const filteredPayments = groupedPayments
    .filter((p) => {
      // Filtre de recherche globale
      const text = searchText.toLowerCase()
      const mainFields = [
        p.compteur?.codeImmeuble,
        p.compteur?.province,
        p.compteur?.quartier,
        p.compteur?.nomPropriete,
        p.compteur?.rg,
        p.compteur?.adresse,
        p.compteur?.localisation,
        p.typeCompteur.join(" / "),
        p.numeroCompteur.join(" / "),
        p.numeroFacture,
        p.montant?.toString()
      ]
      const mainMatch = mainFields.some((f) => f?.toLowerCase().includes(text))
      const globalSearchMatch = searchText === "" || mainMatch

      // Filtres individuels
      const individualFiltersMatch = 
        (filters.codeImmeuble === "" || p.compteur?.codeImmeuble?.toLowerCase().includes(filters.codeImmeuble.toLowerCase())) &&
        (filters.province === "" || p.compteur?.province?.toLowerCase().includes(filters.province.toLowerCase())) &&
        (filters.quartier === "" || p.compteur?.quartier?.toLowerCase().includes(filters.quartier.toLowerCase())) &&
        (filters.nomPropriete === "" || p.compteur?.nomPropriete?.toLowerCase().includes(filters.nomPropriete.toLowerCase())) &&
        (filters.rg === "" || p.compteur?.rg?.toLowerCase().includes(filters.rg.toLowerCase())) &&
        (filters.adresse === "" || p.compteur?.adresse?.toLowerCase().includes(filters.adresse.toLowerCase())) &&
        (filters.localisation === "" || p.compteur?.localisation?.toLowerCase().includes(filters.localisation.toLowerCase())) &&
        (filters.typeCompteur === "" || p.typeCompteur.some(tc => tc.toLowerCase().includes(filters.typeCompteur.toLowerCase()))) &&
        (filters.numeroCompteur === "" || p.numeroCompteur.some(nc => nc.toLowerCase().includes(filters.numeroCompteur.toLowerCase()))) &&
        (filters.numeroFacture === "" || p.numeroFacture?.toLowerCase().includes(filters.numeroFacture.toLowerCase())) &&
        (filters.montant === "" || p.montant?.toString().includes(filters.montant))

      return globalSearchMatch && individualFiltersMatch
    })

  async function downloadBatchPdf() {
    try {
      const res = await fetch(`${API_BASE}/payment-batches/${id}/pdf`)
      if (!res.ok) throw new Error("Erreur lors de la génération du PDF")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `paiement_batch_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      addToast("PDF téléchargé avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        await fetchBatchDetails()
      } catch (err) {
        addToast(err.message, "error")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = Object.values(filters).some(filter => filter !== "")

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner-border text-success" />
        <p>Chargement des détails...</p>
      </div>
    )
  }

  if (!batch) return null

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {showDeleteModalcheque && (
        <div className="modal-overlay" onClick={cancelDeleteCheque}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrapper">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="modal-title">Confirmer la suppression</h3>
            <p className="modal-message">
              Êtes-vous sûr de vouloir supprimer ce chèque ? Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={cancelDeleteCheque}>
                Annuler
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={confirmDeleteCheque}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModalrecu && (
        <div className="modal-overlay" onClick={cancelDeleteRecu}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrapper">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="modal-title">Confirmer la suppression</h3>
            <p className="modal-message">Êtes-vous sûr de vouloir supprimer ce reçu ? Cette action est irréversible.</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={cancelDeleteRecu}>
                Annuler
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={confirmDeleteRecu}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-container">
        <div className="details-header animate-fadeInDown">
          <Link to="/historique" className="btn btn-outline-secondary mb-3">
            <ArrowLeft size={18} />
            Retour à l'historique
          </Link>

          <div className="details-title-section">
            <h2 className="details-title">Détails du paiement #{batch.id}</h2>
            <button onClick={downloadBatchPdf} className="btn btn-success">
              <FileEarmarkPdfFill size={18} />
              Télécharger le reçu PDF
            </button>
          </div>

          <div className="info-cards">
            <div className="info-card animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
              <div
                className="info-card-icon"
                style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
              >
                <CalendarEvent size={24} />
              </div>
              <div className="info-card-content">
                <div className="info-card-label">Date du paiement</div>
                <div className="info-card-value">
                  {new Date(batch.date).toLocaleString("fr-FR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </div>
              </div>
            </div>

            <div className="info-card animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
              <div
                className="info-card-icon"
                style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}
              >
                <CashStack size={24} />
              </div>
              <div className="info-card-content">
                <div className="info-card-label">Montant total</div>
                <div className="info-card-value text-success">{formatMontantFR(batch.total)} Ar</div>
              </div>
            </div>
          </div>

          <div className="documents-grid">
            <div className="cheque-section animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
              <div className="cheque-header">
                <div className="cheque-icon-wrapper">
                  <FileEarmarkPdfFill size={20} />
                </div>
                <div className="cheque-title-wrapper">
                  <h4 className="cheque-title">Gestion du chèque</h4>
                  <p className="cheque-subtitle">{batch.chequePdf ? "Chèque disponible" : "Aucun chèque ajouté"}</p>
                </div>
              </div>

              <div className="cheque-actions">
                <label className="cheque-btn cheque-btn-upload">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {batch.chequePdf ? "Modifier le chèque" : "Ajouter un chèque"}
                  <input
                    type="file"
                    ref={chequeInputRef}
                    style={{ display: "none" }}
                    accept="application/pdf"
                    onChange={handleUploadCheque}
                  />
                </label>

                {batch.chequePdf && (
                  <>
                    <button className="cheque-btn cheque-btn-download" onClick={handleDownloadCheque}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Télécharger
                    </button>
                    <button className="cheque-btn cheque-btn-delete" onClick={handleDeleteCheque}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="cheque-section animate-fadeInUp" style={{ animationDelay: "0.35s" }}>
              <div className="cheque-header">
                <div className="cheque-icon-wrapper">
                  <FileEarmarkPdfFill size={24} />
                </div>
                <div className="cheque-title-wrapper">
                  <h4 className="cheque-title">Gestion du reçu</h4>
                  <p className="cheque-subtitle">{batch.recuPdf ? "Reçu disponible" : "Aucun reçu ajouté"}</p>
                </div>
              </div>

              <div className="cheque-actions">
                <label className="cheque-btn cheque-btn-upload">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {batch.recuPdf ? "Modifier le reçu" : "Ajouter un reçu"}
                  <input
                    type="file"
                    ref={recuInputRef}
                    style={{ display: "none" }}
                    accept="application/pdf"
                    onChange={handleUploadRecu}
                  />
                </label>

                {batch.recuPdf && (
                  <>
                    <button className="cheque-btn cheque-btn-download" onClick={handleDownloadRecu}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Télécharger
                    </button>
                    <button className="cheque-btn cheque-btn-delete" onClick={handleDeleteRecu}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="details-section animate-fadeInUp" style={{ animationDelay: "0.4s" }}>
          <h3 className="section-title">Liste des paiements ({filteredPayments.length})</h3>

          {/* Recherche globale */}
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par code, propriété, adresse, compteur, facture..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
            {searchText && (
              <button className="search-clear" onClick={() => setSearchText("")}>
                <XCircleFill size={18} />
              </button>
            )}
          </div>

          {/* Bouton pour afficher/masquer les filtres avancés */}
          <div className="filters-header">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowFilters(!showFilters)}
              className="filter-toggle-btn"
            >
              <Filter size={16} />
              Filtres avancés {hasActiveFilters && `(${Object.values(filters).filter(f => f !== "").length})`}
            </Button>
            
            {hasActiveFilters && (
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={clearAllFilters}
                className="clear-filters-btn"
              >
                <XCircleFill size={14} />
                Effacer tous les filtres
              </Button>
            )}
          </div>

          {/* Filtres avancés par colonne */}
          {showFilters && (
            <div className="advanced-filters animate-fadeInUp">
              <div className="filters-grid">
                <div className="filter-group">
                  <label className="filter-label">Code Immeuble</label>
                  <input
                    type="text"
                    placeholder="Filtrer par code..."
                    value={filters.codeImmeuble}
                    onChange={(e) => handleFilterChange('codeImmeuble', e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Province</label>
                  <input
                    type="text"
                    placeholder="Filtrer par province..."
                    value={filters.province}
                    onChange={(e) => handleFilterChange('province', e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Quartier</label>
                  <input
                    type="text"
                    placeholder="Filtrer par quartier..."
                    value={filters.quartier}
                    onChange={(e) => handleFilterChange('quartier', e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Propriété</label>
                  <input
                    type="text"
                    placeholder="Filtrer par propriété..."
                    value={filters.nomPropriete}
                    onChange={(e) => handleFilterChange('nomPropriete', e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">RG</label>
                  <input
                    type="text"
                    placeholder="Filtrer par RG..."
                    value={filters.rg}
                    onChange={(e) => handleFilterChange('rg', e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Adresse</label>
                  <input
                    type="text"
                    placeholder="Filtrer par adresse..."
                    value={filters.adresse}
                    onChange={(e) => handleFilterChange('adresse', e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Localisation</label>
                  <input
                    type="text"
                    placeholder="Filtrer par localisation..."
                    value={filters.localisation}
                    onChange={(e) => handleFilterChange('localisation', e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Type Compteur</label>
                  <select
                    value={filters.typeCompteur}
                    onChange={(e) => handleFilterChange('typeCompteur', e.target.value)}
                    className="filter-input"
                  >
                    <option value="">Tous les types</option>
                    <option value="eau">Eau</option>
                    <option value="électricité">Électricité</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">N° Compteur</label>
                  <input
                    type="text"
                    placeholder="Filtrer par compteur..."
                    value={filters.numeroCompteur}
                    onChange={(e) => handleFilterChange('numeroCompteur', e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">N° Facture</label>
                  <input
                    type="text"
                    placeholder="Filtrer par facture..."
                    value={filters.numeroFacture}
                    onChange={(e) => handleFilterChange('numeroFacture', e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Montant</label>
                  <input
                    type="text"
                    placeholder="Filtrer par montant..."
                    value={filters.montant}
                    onChange={(e) => handleFilterChange('montant', e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Code Immeuble</th>
                  <th>Province</th>
                  <th>Quartier</th>
                  <th>Propriété</th>
                  <th>RG</th>
                  <th>Adresse</th>
                  <th>Localisation</th>
                  <th>Type Compteur</th>
                  <th>N°Compteur</th>
                  <th>N° Facture</th>
                  <th>Montant (Ar)</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-5">
                      <div className="empty-state">
                        <FileEarmarkPdfFill size={48} className="text-muted mb-3" />
                        <p className="text-muted">Aucun paiement trouvé</p>
                        {(searchText || hasActiveFilters) && (
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => {
                              setSearchText("")
                              clearAllFilters()
                            }}
                          >
                            Réinitialiser les filtres
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.compteur?.codeImmeuble ?? "-"}</strong>
                      </td>
                      <td>{p.compteur?.province ?? "-"}</td>
                      <td>{p.compteur?.quartier ?? "-"}</td>
                      <td>{p.compteur?.nomPropriete ?? "-"}</td>
                      <td>{p.compteur?.rg ?? "-"}</td>
                      <td>{p.compteur?.adresse ?? "-"}</td>
                      <td>{p.compteur?.localisation ?? "-"}</td>
                      <td>
                        <span className={`badge-type`}>{p.typeCompteur.join(" / ")}</span>
                      </td>
                      <td>
                        <span className="compteur-badge" style={{ textTransform: "none" }}>
                          {p.numeroCompteur.join(" / ")}
                        </span>
                      </td>
                      <td>{p.numeroFacture ?? "-"}</td>
                      <td>
                        <strong className="text-success">{formatMontantFR(p.montant)}</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        /* Added keyframe animations for page entrance */
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out forwards;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fadeInScale {
          animation: fadeInScale 0.5s ease-out forwards;
        }

        .details-header {
          margin-bottom: 32px;
        }

        .details-title-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .details-title {
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
        }

        .info-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .info-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 2px solid #f3f4f6;
          transition: all 0.2s;
        }

        .info-card:hover {
          border-color: #dcfce7;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .info-card-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .info-card-content {
          flex: 1;
        }

        .info-card-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #9ca3af;
          margin-bottom: 4px;
        }

        .info-card-value {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }

        /* Added grid container for side-by-side document sections */
        .documents-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .cheque-section {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 16px rgba(251, 191, 36, 0.15);
          border: 2px solid #fbbf24;
        }

        .cheque-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .cheque-icon-wrapper {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          flex-shrink: 0;
        }

        .cheque-title-wrapper {
          flex: 1;
        }

        .cheque-title {
          font-size: 18px;
          font-weight: 700;
          color: #78350f;
          margin: 0 0 4px 0;
        }

        .cheque-subtitle {
          font-size: 13px;
          color: #92400e;
          margin: 0;
          font-weight: 500;
        }

        .cheque-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .cheque-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          white-space: nowrap;
        }

        .cheque-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .cheque-btn:active {
          transform: translateY(0);
        }

        .cheque-btn-upload {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }

        .cheque-btn-upload:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .cheque-btn-download {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: white;
        }

        .cheque-btn-download:hover {
          background: linear-gradient(135deg, #15803d 0%, #166534 100%);
        }

        .cheque-btn-delete {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
        }

        .cheque-btn-delete:hover {
          background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
        }

        .cheque-btn svg {
          flex-shrink: 0;
        }

        .details-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f3f4f6;
        }

        /* Styles pour la recherche et les filtres */
        .search-bar {
          position: relative;
          margin-bottom: 16px;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .search-input {
          width: 100%;
          padding: 14px 48px 14px 48px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s;
          background: white;
        }

        .search-input:focus {
          outline: none;
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
        }

        .search-clear {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .search-clear:hover {
          color: #ef4444;
        }

        .filters-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .filter-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .clear-filters-btn {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .advanced-filters {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-label {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-input {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .filter-input:focus {
          outline: none;
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
        }

        .empty-state {
          padding: 40px;
          text-align: center;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          padding: 32px;
          max-width: 440px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
          text-align: center;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-icon-wrapper {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: #dc2626;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 12px 0;
        }

        .modal-message {
          font-size: 15px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0 0 28px 0;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .modal-btn {
          flex: 1;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .modal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .modal-btn:active {
          transform: translateY(0);
        }

        .modal-btn-cancel {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-btn-cancel:hover {
          background: #e5e7eb;
        }

        .modal-btn-confirm {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
        }

        .modal-btn-confirm:hover {
          background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
        }

        @media (max-width: 768px) {
          .details-title-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .details-title-section .btn {
            width: 100%;
          }

          .info-cards {
            grid-template-columns: 1fr;
          }

          /* Stack document sections vertically on mobile */
          .documents-grid {
            grid-template-columns: 1fr;
          }

          .cheque-section {
            padding: 20px;
          }

          .cheque-actions {
            flex-direction: column;
          }

          .cheque-btn {
            width: 100%;
            justify-content: center;
          }

          .modal-content {
            padding: 24px;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-btn {
            width: 100%;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }

          .filters-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  )
}
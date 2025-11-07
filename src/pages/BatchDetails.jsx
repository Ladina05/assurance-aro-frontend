"use client"

import React, { useRef } from "react"
import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  getBatchDetails,
  downloadBatchPdf,
  downloadCheque,
  downloadRecu,
  uploadCheque,
  uploadRecu,
  deleteCheque,
  deleteRecu
} from "../services/api"
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
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)
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
  const [showChequePreview, setShowChequePreview] = useState(false)
  const [showRecuPreview, setShowRecuPreview] = useState(false)
  const [chequePdfUrl, setChequePdfUrl] = useState(null)
  const [recuPdfUrl, setRecuPdfUrl] = useState(null)

  const formatMontantFR = (montant) => {
    if (montant == null) return "-"
    return montant
      .toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      .replace(/\u202F/g, " ") // espace normal
  }

  const chequeInputRef = useRef(null)
  const recuInputRef = useRef(null)

  const formatPeriodePaiement = (batch) => {
    if (!batch.moisPaiement || !batch.anneePaiement) {
      // Si pas de période spécifique, utiliser la date du batch
      const dateBatch = new Date(batch.date);
      const mois = dateBatch.toLocaleString('fr-FR', { month: 'long' });
      const annee = dateBatch.getFullYear();
      return `${mois} ${annee}`;
    }

    const nomsMois = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];

    const nomMois = nomsMois[batch.moisPaiement - 1];
    return `${nomMois} ${batch.anneePaiement}`;
  }

  const fetchBatchDetails = async () => {
    try {
      const data = await getBatchDetails(id)
      setBatch(data)
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  // Fonction pour gérer le téléchargement avec confirmation
  const handleDownloadWithConfirm = () => {
    setShowDownloadConfirm(true)
  }

  // Fonction pour confirmer et télécharger le PDF
  const confirmDownloadPdf = async () => {
    setShowDownloadConfirm(false)
    try {
      const blob = await downloadBatchPdf(id)
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

  // Fonction pour annuler le téléchargement
  const cancelDownload = () => {
    setShowDownloadConfirm(false)
  }

  // Fonction pour calculer le total général (identique à celle du backend)
  const calculerTotalGeneral = () => {
    return groupedPayments.reduce((sum, p) => sum + (p.montant || 0), 0)
  }

  // Fonction pour formater le montant (identique à celle du backend)
  const formatMontantTableau = (montant) => {
    if (montant == null) return "-"
    return montant.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).replace(/\u202F/g, ' ')
  }

  // Fonction pour regrouper par quartier (identique à la logique du PDF)
  const getPaymentsGroupesParQuartier = () => {
    const paiementsTries = [...groupedPayments].sort((a, b) => {
      const q1 = a.compteur?.quartier?.toLowerCase() || ''
      const q2 = b.compteur?.quartier?.toLowerCase() || ''
      return q1.localeCompare(q2)
    })

    const groupes = {}
    paiementsTries.forEach(p => {
      const quartier = p.compteur?.quartier || 'Non défini'
      if (!groupes[quartier]) {
        groupes[quartier] = []
      }
      groupes[quartier].push(p)
    })

    return groupes
  }

  const tableauEstTropLong = () => {
    const groupes = getPaymentsGroupesParQuartier();
    const totalLignes = Object.values(groupes).reduce(
      (total, payments) => total + payments.length + 1, // +1 pour la ligne de sous-total
      1 // +1 pour la ligne de total général
    );
    return totalLignes > 15; // Si plus de 15 lignes, considérer comme long
  };

  const handleUploadCheque = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      await uploadCheque(id, file)
      await fetchBatchDetails()
      addToast("Chèque ajouté avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleUploadRecu = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      await uploadRecu(id, file)
      await fetchBatchDetails()
      addToast("Reçu ajouté avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleDownloadCheque = async () => {
    try {
      const blob = await downloadCheque(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = batch.chequePdf || `cheque_batch_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      addToast("Chèque téléchargé avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleDownloadRecu = async () => {
    try {
      const blob = await downloadRecu(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = batch.recuPdf || `recu_batch_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      addToast("Reçu téléchargé avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  // CORRECTION : Renommer la fonction pour éviter le conflit
  const handleDownloadBatchPdf = async () => {
    try {
      const blob = await downloadBatchPdf(id)
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

  const handleDeleteCheque = async () => {
    setShowDeleteModalcheque(true)
  }

  const handleDeleteRecu = async () => {
    setShowDeleteModalrecu(true)
  }

  const confirmDeleteCheque = async () => {
    try {
      await deleteCheque(id)
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
      await deleteRecu(id)
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

  const handleShowChequePreview = async () => {
    try {
      const blob = await downloadCheque(id)
      const url = window.URL.createObjectURL(blob)
      setChequePdfUrl(url)
      setShowChequePreview(true)
    } catch (err) {
      addToast("Erreur lors du chargement du chèque", "error")
    }
  }

  const handleShowRecuPreview = async () => {
    try {
      const blob = await downloadRecu(id)
      const url = window.URL.createObjectURL(blob)
      setRecuPdfUrl(url)
      setShowRecuPreview(true)
    } catch (err) {
      addToast("Erreur lors du chargement du reçu", "error")
    }
  }

  // N'oubliez pas de révoquer les URLs quand on ferme les modals
  const handleCloseChequePreview = () => {
    if (chequePdfUrl) {
      window.URL.revokeObjectURL(chequePdfUrl)
      setChequePdfUrl(null)
    }
    setShowChequePreview(false)
  }

  const handleCloseRecuPreview = () => {
    if (recuPdfUrl) {
      window.URL.revokeObjectURL(recuPdfUrl)
      setRecuPdfUrl(null)
    }
    setShowRecuPreview(false)
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
      const key = p.numeroFacture ?? `nofacture-${p.id}`
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

      {/* Modal d'aperçu du chèque */}
      {showChequePreview && batch.chequePdf && (
        <div className="modal-overlay pdf-modal-overlay" onClick={handleCloseChequePreview}>
          <div className="modal-content pdf-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-preview-header">
              <div className="pdf-title-section">
                <h3>Aperçu du Chèque</h3>
                <p className="text-muted">Document: {batch.chequePdf}</p>
              </div>
              <button className="pdf-close-btn" onClick={handleCloseChequePreview}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="pdf-preview-container">
              {chequePdfUrl ? (
                <div className="pdf-iframe-wrapper">
                  <iframe
                    src={`${chequePdfUrl}#view=FitH&zoom=scale`}
                    title="Aperçu du chèque"
                    className="pdf-preview-frame"
                    type="application/pdf"
                  />
                </div>
              ) : (
                <div className="pdf-loading">
                  <div className="spinner-border text-primary"></div>
                  <p>Chargement du chèque...</p>
                </div>
              )}
            </div>

            <div className="pdf-preview-actions">
              <label className="cheque-btn cheque-btn-upload">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Modifier
                <input
                  type="file"
                  ref={chequeInputRef}
                  style={{ display: "none" }}
                  accept="application/pdf"
                  onChange={handleUploadCheque}
                />
              </label>

              <button
                className="cheque-btn cheque-btn-download"
                onClick={handleDownloadCheque}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Télécharger
              </button>

              <button
                className="cheque-btn cheque-btn-delete"
                onClick={confirmDeleteCheque}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Supprimer
              </button>

              <button
                className="cheque-btn cheque-btn-close"
                onClick={handleCloseChequePreview}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'aperçu du reçu */}
      {showRecuPreview && batch.recuPdf && (
        <div className="modal-overlay pdf-modal-overlay" onClick={handleCloseRecuPreview}>
          <div className="modal-content pdf-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-preview-header">
              <div className="pdf-title-section">
                <h3>Aperçu du Reçu</h3>
                <p className="text-muted">Document: {batch.recuPdf}</p>
              </div>
              <button className="pdf-close-btn" onClick={handleCloseRecuPreview}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="pdf-preview-container">
              {recuPdfUrl ? (
                <div className="pdf-iframe-wrapper">
                  <iframe
                    src={`${recuPdfUrl}#view=FitH&zoom=scale`}
                    title="Aperçu du reçu"
                    className="pdf-preview-frame"
                    type="application/pdf"
                  />
                </div>
              ) : (
                <div className="pdf-loading">
                  <div className="spinner-border text-primary"></div>
                  <p>Chargement du reçu...</p>
                </div>
              )}
            </div>

            <div className="pdf-preview-actions">
              <label className="cheque-btn cheque-btn-upload">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Modifier
                <input
                  type="file"
                  ref={recuInputRef}
                  style={{ display: "none" }}
                  accept="application/pdf"
                  onChange={handleUploadRecu}
                />
              </label>

              <button
                className="cheque-btn cheque-btn-download"
                onClick={handleDownloadRecu}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Télécharger
              </button>

              <button
                className="cheque-btn cheque-btn-delete"
                onClick={confirmDeleteRecu}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Supprimer
              </button>

              <button
                className="cheque-btn cheque-btn-close"
                onClick={handleCloseRecuPreview}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation pour le téléchargement PDF */}
      {showDownloadConfirm && (
        <div className="modal-overlay" onClick={cancelDownload}>
          <div className="modal-content pdf-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrapper pdf-icon">
              <FileEarmarkPdfFill size={32} />
            </div>
            <h3 className="modal-title">Confirmer le téléchargement</h3>
            <p className="modal-message">
              Vous êtes sur le point de télécharger le PDF pour le paiement de <strong>{formatPeriodePaiement(batch)}</strong>.
              Le fichier contiendra le tableau suivant :
            </p>

            {/* Aperçu du tableau qui sera dans le PDF */}
            <div className="pdf-preview">
              <div className="pdf-preview-header">
                <h4>Aperçu du PDF - {formatPeriodePaiement(batch)}</h4>
                <div className="preview-info">
                  <span>Total général: <strong>{formatMontantTableau(calculerTotalGeneral())} Ar</strong></span>
                  <span>Nombre de paiements: <strong>{groupedPayments.length}</strong></span>
                  <span>Nombre de quartiers: <strong>{Object.keys(getPaymentsGroupesParQuartier()).length}</strong></span>
                </div>
              </div>

              <div className={`preview-table-container ${tableauEstTropLong() ? 'scrollable' : ''}`}>
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Province</th>
                      <th>Quartier</th>
                      <th>Adresse</th>
                      <th>RG</th>
                      <th>Type Compteur</th>
                      <th>N° Facture</th>
                      <th>Montant (Ar)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(getPaymentsGroupesParQuartier()).map(([quartier, payments]) => (
                      <>
                        {payments.map((p, index) => (
                          <tr key={`${quartier}-${index}`}>
                            <td>{p.compteur?.province || 'N/A'}</td>
                            <td>
                              <strong>{quartier}</strong>
                            </td>
                            <td className="address-cell">
                              {p.compteur?.adresse || '-'}
                            </td>
                            <td>{p.compteur?.rg || '-'}</td>
                            <td>
                              <span className="type-badge">
                                {p.typeCompteur.join(' / ')}
                              </span>
                            </td>
                            <td>
                              <code>{p.numeroFacture || 'N/A'}</code>
                            </td>
                            <td className="text-end">
                              <strong>{formatMontantTableau(p.montant)}</strong>
                            </td>
                          </tr>
                        ))}
                        {/* Sous-total par quartier */}
                        <tr className="subtotal-row">
                          <td colSpan="6" className="text-end">
                            <strong>Sous-total {quartier}:</strong>
                          </td>
                          <td className="text-end">
                            <strong className="subtotal-amount">
                              {formatMontantTableau(
                                payments.reduce((sum, p) => sum + (p.montant || 0), 0)
                              )}
                            </strong>
                          </td>
                        </tr>
                      </>
                    ))}
                    {/* Total général */}
                    <tr className="total-row">
                      <td colSpan="6" className="text-end">
                        <strong>TOTAL GÉNÉRAL:</strong>
                      </td>
                      <td className="text-end">
                        <strong className="total-amount">
                          {formatMontantTableau(calculerTotalGeneral())}
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Message d'information pour les tables longues */}
                {tableauEstTropLong() && (
                  <div className="table-info">
                    🔍 Tableau avec défilement - {Object.keys(getPaymentsGroupesParQuartier()).length} quartiers • {groupedPayments.length} paiements
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={cancelDownload}>
                Annuler
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={confirmDownloadPdf}>
                <FileEarmarkPdfFill size={16} />
                Télécharger le PDF
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
            <h2 className="details-title">Détails du paiement {formatPeriodePaiement(batch)}</h2>
            {/* MODIFICATION : Utiliser handleDownloadWithConfirm au lieu de handleDownloadBatchPdf */}
            <button onClick={handleDownloadWithConfirm} className="btn btn-success" style={{ background: "#0d9488" }}>
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
                style={{ background: "linear-gradient(135deg, #0d9488 0%, #0d9488 100%)" }}
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
                    <button className="cheque-btn cheque-btn-view" onClick={handleShowChequePreview}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Voir
                    </button>
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
                    <button className="cheque-btn cheque-btn-view" onClick={handleShowRecuPreview}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Voir
                    </button>
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

        .table{
        text-align: center;
        }
        
        th, td {
          background-color: white;
          padding: 8px;
          border: 1px solid #ddd;
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
          background: rgba(253, 251, 251, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease;
          padding: 20px;
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

        /* Styles pour le modal d'aperçu PDF */
        .pdf-preview-modal {
          max-width: 95vw; /* Utiliser presque toute la largeur de l'écran */
          max-height: 90vh; /* Utiliser presque toute la hauteur de l'écran */
          width: 1200px; /* Largeur fixe plus grande */
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .pdf-preview-modal .modal-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%; /* Prendre toute la largeur disponible */
        }

        .pdf-icon {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
          color: white;
        }

        .pdf-preview {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin: 16px 0;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          min-height: 400px; /* Hauteur minimale */
        }

        .pdf-preview-header {
          background: #f8fafc;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0; /* Empêcher le header de rétrécir */
        }

        .pdf-preview-header h4 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 18px; /* Taille de police légèrement plus grande */
          font-weight: 600;
        }

        .preview-info {
          display: flex;
          gap: 30px; /* Plus d'espace entre les infos */
          font-size: 14px;
          color: #6b7280;
        }

        .preview-info strong {
          color: #059669;
          font-size: 15px;
        }

        .preview-table-container {
          flex: 1;
          overflow: auto;
          max-height: none; /* Supprimer la hauteur maximale fixe */
          min-height: 300px; /* Hauteur minimale pour le tableau */
        }

        .preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px; /* Taille de police légèrement plus grande */
        }

        .preview-table th {
          background: #f3f4f6;
          padding: 12px 16px; /* Plus de padding */
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #d1d5db; /* Bordure plus épaisse */
          position: sticky;
          top: 0;
          z-index: 10;
          white-space: nowrap; /* Empêcher le texte de se casser */
        }

        .preview-table td {
          padding: 10px 16px; /* Plus de padding */
          border-bottom: 1px solid #f3f4f6;
          color: #4b5563;
          vertical-align: top; /* Aligner en haut pour les cellules multi-lignes */
        }

        .preview-table tbody tr:hover {
          background: #f9fafb;
        }

        .subtotal-row {
          background: #f0fdf4 !important;
          border-top: 2px solid #dcfce7;
        }

        .subtotal-row td {
          font-weight: 600;
          color: #166534;
          padding: 12px 16px;
          font-size: 13px;
        }

        .total-row {
          background: #dcfce7 !important;
          border-top: 3px solid #16a34a; /* Bordure plus visible */
        }

        .total-row td {
          font-weight: 700;
          color: #166534;
          padding: 14px 16px;
          font-size: 14px;
        }

        .text-end {
          text-align: right;
        }

        /* Animation pour l'apparition du modal */
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .pdf-preview-modal .modal-content {
          animation: scaleIn 0.3s ease;
        }

        /* Styles pour gérer les listes très longues */
        .preview-table-container.scrollable {
          max-height: 60vh; /* Hauteur maximale seulement si nécessaire */
        }

        .table-info {
          position: sticky;
          bottom: 0;
          background: #f8fafc;
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }

        /* Amélioration de la scrollbar */
        .preview-table-container::-webkit-scrollbar {
          width: 8px;
        }

        .preview-table-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .preview-table-container::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        .preview-table-container::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        /* Styles pour les cellules d'adresse */
        .address-cell {
          max-width: 200px;
          word-wrap: break-word;
        }

        /* Badge pour le type de compteur */
        .type-badge {
          background: #e0e7ff;
          color: #3730a3;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
        }

        /* Style pour le code des numéros de facture */
        code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #1f2937;
        }

        /* Styles pour les montants */
        .subtotal-amount {
          color: #0d9488;
          font-size: 13px;
        }

        .total-amount {
          color: #0d9488;
          font-size: 14px;
        }

        /* Responsive pour les très grands écrans */
        @media (min-width: 1400px) {
          .pdf-preview-modal {
            max-width: 1300px;
          }
          
          .preview-table {
            font-size: 14px;
          }
        }

        /* Responsive pour les petits écrans */
        @media (max-width: 768px) {
          .pdf-preview-modal {
            max-width: 98vw;
            max-height: 95vh;
          }
          
          .pdf-preview-header h4 {
            font-size: 16px;
          }
          
          .preview-info {
            flex-direction: column;
            gap: 8px;
          }
          
          .preview-table th,
          .preview-table td {
            padding: 8px 12px;
            font-size: 12px;
          }
          
          .address-cell {
            max-width: 120px;
          }
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

        /* ========================================================================== */
        /* STYLES SPÉCIFIQUES POUR LES MODALS PDF AGRANDIS */
        /* ========================================================================== */

        .pdf-modal-overlay {
          background: rgba(0, 0, 0, 0.95) !important;
          backdrop-filter: blur(16px);
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .pdf-preview-modal {
          width: 98vw !important;
          height: 98vh !important;
          max-width: none !important;
          max-height: none !important;
          padding: 0 !important;
          border-radius: 12px;
          background: white;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.8);
          border: 2px solid #e5e7eb;
          animation: pdfModalAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes pdfModalAppear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .pdf-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: #f8fafc;
          border-bottom: 2px solid #e5e7eb;
          flex-shrink: 0;
          min-height: 60px;
        }

        .pdf-title-section h3 {
          margin: 0 0 4px 0;
          font-size: 22px;
          font-weight: 700;
          color: #1f2937;
        }

        .pdf-title-section .text-muted {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .pdf-close-btn {
          background: none;
          border: none;
          padding: 12px;
          border-radius: 10px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pdf-close-btn:hover {
          background: #e5e7eb;
          color: #374151;
          transform: scale(1.1);
        }

        .pdf-preview-container {
          flex: 1;
          background: #f8fafc;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
          padding: 0;
        }

        .pdf-iframe-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          padding: 0;
        }

        .pdf-preview-frame {
          width: 100%;
          height: 100%;
          border: none;
          background: white;
        }

        .pdf-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
          background: white;
          width: 100%;
          height: 100%;
        }

        .pdf-loading .spinner-border {
          width: 3rem;
          height: 3rem;
          border-width: 3px;
          color: #3b82f6;
        }

        .pdf-loading p {
          margin-top: 16px;
          font-size: 16px;
          font-weight: 500;
        }

        .pdf-preview-actions {
          display: flex;
          gap: 12px;
          padding: 20px 24px;
          background: #f8fafc;
          border-top: 2px solid #e5e7eb;
          flex-shrink: 0;
          justify-content: center;
          flex-wrap: wrap;
        }

        .pdf-preview-actions .cheque-btn {
          min-width: 140px;
          justify-content: center;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .pdf-preview-actions .cheque-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        /* Bouton Fermer spécifique */
        .cheque-btn-close {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: white;
        }

        .cheque-btn-close:hover {
          background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
        }

        /* Mode plein écran */
        .pdf-preview-modal.fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          border-radius: 0;
        }

        /* Responsive pour très grands écrans */
        @media (min-width: 1920px) {
          .pdf-preview-modal {
            width: 90vw !important;
            height: 90vh !important;
          }
        }

        /* Responsive tablette */
        @media (max-width: 1024px) {
          .pdf-modal-overlay {
            padding: 15px;
          }
          
          .pdf-preview-modal {
            width: 95vw !important;
            height: 95vh !important;
          }
          
          .pdf-preview-header {
            padding: 14px 20px;
            min-height: 55px;
          }
          
          .pdf-title-section h3 {
            font-size: 20px;
          }
        }

        /* Responsive mobile */
        @media (max-width: 768px) {
          .pdf-modal-overlay {
            padding: 5px;
          }

          .pdf-preview-modal {
            width: 100vw !important;
            height: 100vh !important;
            border-radius: 0;
          }

          .pdf-preview-header {
            padding: 12px 16px;
            min-height: 50px;
          }

          .pdf-title-section h3 {
            font-size: 18px;
          }

          .pdf-title-section .text-muted {
            font-size: 12px;
          }

          .pdf-preview-actions {
            padding: 16px 20px;
            gap: 8px;
          }

          .pdf-preview-actions .cheque-btn {
            min-width: 120px;
            padding: 10px 16px;
            font-size: 13px;
            flex: 1;
          }
        }

        /* Très petits écrans */
        @media (max-width: 480px) {
          .pdf-preview-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
            padding: 10px 12px;
          }

          .pdf-close-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid #e5e7eb;
          }

          .pdf-preview-actions {
            flex-direction: column;
            padding: 12px 16px;
          }

          .pdf-preview-actions .cheque-btn {
            width: 100%;
            min-width: auto;
          }
        }

        /* Amélioration de la scrollbar pour le conteneur PDF */
        .pdf-preview-container::-webkit-scrollbar {
          width: 8px;
        }

        .pdf-preview-container::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .pdf-preview-container::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        .pdf-preview-container::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </>
  )
}
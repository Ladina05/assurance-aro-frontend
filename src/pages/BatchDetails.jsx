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
      .replace(/\u202F/g, " ")
  }

  const chequeInputRef = useRef(null)
  const recuInputRef = useRef(null)

  const formatPeriodePaiement = (batch) => {
    if (!batch.moisPaiement || !batch.anneePaiement) {
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

  const getNomMois = (mois) => {
    const nomsMois = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ]
    return nomsMois[mois - 1] || 'Mois inconnu'
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

  // Fonction pour calculer le total général
  const calculerTotalGeneral = () => {
    return groupedPayments.reduce((sum, p) => sum + (p.montant || 0), 0)
  }

  // Fonction pour formater le montant
  const formatMontantTableau = (montant) => {
    if (montant == null) return "-"
    return montant.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).replace(/\u202F/g, ' ')
  }

  // Fonction pour regrouper par quartier
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

  // Fonction pour regrouper par propriété (remplace l'ancienne fonction par quartier)
  const getPaymentsGroupesParPropriete = () => {
    const paiementsTries = [...groupedPayments].sort((a, b) => {
      const prop1 = a.compteur?.nomPropriete?.toLowerCase() || ''
      const prop2 = b.compteur?.nomPropriete?.toLowerCase() || ''
      return prop1.localeCompare(prop2)
    })

    const groupes = {}
    paiementsTries.forEach(p => {
      const propriete = p.compteur?.nomPropriete || 'Non défini'
      if (!groupes[propriete]) {
        groupes[propriete] = []
      }
      groupes[propriete].push(p)
    })

    return groupes
  }

  // Fonction pour vérifier si le tableau est trop long (adaptée pour les propriétés)
  const tableauEstTropLong = () => {
    const groupes = getPaymentsGroupesParPropriete();
    const totalLignes = Object.values(groupes).reduce(
      (total, payments) => total + payments.length + 1,
      1
    );
    return totalLignes > 15;
  };

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
                  <span>Nombre de propriétés: <strong>{Object.keys(getPaymentsGroupesParPropriete()).length}</strong></span>
                </div>
              </div>

              <div className={`preview-table-container ${tableauEstTropLong() ? 'scrollable' : ''}`}>
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Propriété</th>
                      <th>Localisation</th>
                      <th>RG</th>
                      <th>Type</th>
                      <th>Mois et année</th>
                      <th>N°Facture</th>
                      <th>Montant (Ar)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(getPaymentsGroupesParPropriete()).map(([propriete, payments]) => (
                      <>
                        {payments.map((p, index) => (
                          <tr key={`${propriete}-${index}`}>
                            <td>
                              <strong>{propriete}</strong>
                            </td>
                            <td>{p.compteur?.localisation || '-'}</td>
                            <td>{p.compteur?.rg || '-'}</td>
                            <td>
                              <span className="type-badge">
                                {p.typeCompteur.join(' / ')}
                              </span>
                            </td>
                            <td>
                              {p.mois && p.annee ? `${getNomMois(p.mois)} ${p.annee}` : '-'}
                            </td>
                            <td>
                              <code>{p.numeroFacture || 'N/A'}</code>
                            </td>
                            <td className="text-end">
                              <strong>{formatMontantTableau(p.montant)}</strong>
                            </td>
                          </tr>
                        ))}
                        {/* Sous-total par propriété */}
                        <tr className="subtotal-row">
                          <td colSpan="6" className="text-end">
                            <strong>Sous-total {propriete}:</strong>
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
                    🔍 Tableau avec défilement - {Object.keys(getPaymentsGroupesParPropriete()).length} propriétés • {groupedPayments.length} paiements
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
                  <th>Période</th>
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
                        {p.mois && p.annee ? `${getNomMois(p.mois)} ${p.annee}` : '-'}
                      </td>
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
    </>
  )
}
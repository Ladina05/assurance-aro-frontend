"use client"

import { useEffect, useState } from "react"
import { getBatches, getBatchDetails, downloadBatchPdf, deleteBatch } from "../services/api"
import { Link } from "react-router-dom"
import {
  ClockHistory,
  EyeFill,
  TrashFill,
  FileEarmarkPdfFill,
  Search,
  XCircleFill,
  Filter,
} from "react-bootstrap-icons"
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap"
import ConfirmDialog from "../components/ConfirmDialog"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
const formatMontantFR = (montant) => {
  if (montant == null) return "-"
  return (
    montant
      .toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      .replace(/\u202F/g, "  ") + " Ar"
  )
}

export default function Historique() {
  const [batches, setBatches] = useState([])
  const [batchesWithDetails, setBatchesWithDetails] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState(null)
  const { toasts, addToast, removeToast } = useToast()
  const [searchText, setSearchText] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    id: "",
    date: "",
    periodePaiement: "",
    total: "",
    chequePdf: "",
    recuPdf: "",
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
    montant: "",
  })

  const nomsMois = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ]

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getBatches()
        setBatches(data)

        const batchesDetails = await Promise.all(
          data.map(async (batch) => {
            try {
              const details = await getBatchDetails(batch.id)
              return {
                ...batch,
                payments: details.payments || [],
              }
            } catch (err) {
              console.error(`Erreur chargement détails batch ${batch.id}:`, err)
              return {
                ...batch,
                payments: [],
              }
            }
          }),
        )
        setBatchesWithDetails(batchesDetails)
      } catch (err) {
        addToast(err.message, "error")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDeleteClick = (batch) => {
    setBatchToDelete(batch)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteBatch(batchToDelete.id)
      setBatches((prev) => prev.filter((batch) => batch.id !== batchToDelete.id))
      setBatchesWithDetails((prev) => prev.filter((batch) => batch.id !== batchToDelete.id))
      addToast("Historique supprimé avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setShowDeleteConfirm(false)
      setBatchToDelete(null)
    }
  }

  const handleDownloadPdf = async (batchId) => {
    try {
      const blob = await downloadBatchPdf(batchId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `paiement_batch_${batchId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      addToast("PDF téléchargé avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const formatPeriodePaiement = (batch) => {
    if (!batch.moisPaiement || !batch.anneePaiement) {
      return "Non spécifié";
    }
    
    const nomsMois = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    
    const nomMois = nomsMois[batch.moisPaiement - 1];
    return `${nomMois} ${batch.anneePaiement}`;
  }

  const getPeriodePaiementText = (batch) => {
    if (!batch.moisPaiement || !batch.anneePaiement) {
      return "non spécifié";
    }
    
    const nomMois = nomsMois[batch.moisPaiement - 1];
    return `${nomMois} ${batch.anneePaiement}`;
  }

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      id: "",
      date: "",
      periodePaiement: "",
      total: "",
      chequePdf: "",
      recuPdf: "",
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
      montant: "",
    })
  }

  const filteredBatches = batchesWithDetails
    .filter((batch) => {
      const text = searchText.toLowerCase()

      const batchFields = [
        batch.id?.toString(),
        new Date(batch.date).toLocaleDateString("fr-FR"),
        batch.total?.toString(),
        batch.chequePdf ? "oui" : "non",
        batch.recuPdf ? "oui" : "non",
        getPeriodePaiementText(batch),
      ]

      const paymentFields =
        batch.payments?.flatMap((p) => [
          p.compteur?.codeImmeuble,
          p.compteur?.province,
          p.compteur?.quartier,
          p.compteur?.nomPropriete,
          p.compteur?.rg,
          p.compteur?.adresse,
          p.compteur?.localisation,
          p.typeCompteur,
          p.numeroCompteur,
          p.numeroFacture,
          p.montant?.toString(),
        ]) || []

      const allFields = [...batchFields, ...paymentFields]
      const globalSearchMatch = searchText === "" || allFields.some((field) => field?.toLowerCase().includes(text))

      const periodePaiementMatch = filters.periodePaiement === "" || 
        getPeriodePaiementText(batch).toLowerCase().includes(filters.periodePaiement.toLowerCase())

      const individualFiltersMatch =
        (filters.id === "" || batch.id?.toString().includes(filters.id)) &&
        (filters.date === "" || new Date(batch.date).toLocaleDateString("fr-FR").includes(filters.date)) &&
        periodePaiementMatch && // Application du filtre période de paiement
        (filters.total === "" || batch.total?.toString().includes(filters.total)) &&
        (filters.chequePdf === "" ||
          (filters.chequePdf === "oui" && batch.chequePdf) ||
          (filters.chequePdf === "non" && !batch.chequePdf)) &&
        (filters.recuPdf === "" ||
          (filters.recuPdf === "oui" && batch.recuPdf) ||
          (filters.recuPdf === "non" && !batch.recuPdf)) &&
        (filters.codeImmeuble === "" ||
          batch.payments?.some((p) =>
            p.compteur?.codeImmeuble?.toLowerCase().includes(filters.codeImmeuble.toLowerCase()),
          )) &&
        (filters.province === "" ||
          batch.payments?.some((p) => p.compteur?.province?.toLowerCase().includes(filters.province.toLowerCase()))) &&
        (filters.quartier === "" ||
          batch.payments?.some((p) => p.compteur?.quartier?.toLowerCase().includes(filters.quartier.toLowerCase()))) &&
        (filters.nomPropriete === "" ||
          batch.payments?.some((p) =>
            p.compteur?.nomPropriete?.toLowerCase().includes(filters.nomPropriete.toLowerCase()),
          )) &&
        (filters.rg === "" ||
          batch.payments?.some((p) => p.compteur?.rg?.toLowerCase().includes(filters.rg.toLowerCase()))) &&
        (filters.adresse === "" ||
          batch.payments?.some((p) => p.compteur?.adresse?.toLowerCase().includes(filters.adresse.toLowerCase()))) &&
        (filters.localisation === "" ||
          batch.payments?.some((p) =>
            p.compteur?.localisation?.toLowerCase().includes(filters.localisation.toLowerCase()),
          )) &&
        (filters.typeCompteur === "" ||
          batch.payments?.some((p) => p.typeCompteur?.toLowerCase().includes(filters.typeCompteur.toLowerCase()))) &&
        (filters.numeroCompteur === "" ||
          batch.payments?.some((p) =>
            p.numeroCompteur?.toLowerCase().includes(filters.numeroCompteur.toLowerCase()),
          )) &&
        (filters.numeroFacture === "" ||
          batch.payments?.some((p) => p.numeroFacture?.toLowerCase().includes(filters.numeroFacture.toLowerCase()))) &&
        (filters.montant === "" || batch.payments?.some((p) => p.montant?.toString().includes(filters.montant)))

      return globalSearchMatch && individualFiltersMatch
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const hasActiveFilters = Object.values(filters).some((filter) => filter !== "")

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <ConfirmDialog
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'historique"
        message={`Êtes-vous sûr de vouloir supprimer l'historique de ce paiement? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      <div className="page-container">
        <div className="page-header animate-fade-in-down">
          <div className="page-header-content animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="page-icon" style={{ background: "linear-gradient(135deg, #59ecdbff 0%, #0d9488 100%)" }}>
              <ClockHistory size={28} />
            </div>
            <div>
              <h2 className="page-title">Historique des paiements</h2>
              <p className="page-subtitle">Consultez l'historique de tous vos paiements mensuels</p>
            </div>
          </div>
          <div
            className="stats-badge animate-fade-in-up"
            style={{
              background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
              animationDelay: "0.2s",
            }}
          >
            <span className="stats-number">{filteredBatches.length}</span>
            <span className="stats-label">Paiements</span>
          </div>
        </div>

        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par ID, date, période de paiement, total, propriété, compteur, facture..."
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

        <div className="filters-header">
          <Button
            variant="outline-secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="filter-toggle-btn"
          >
            <Filter size={16} />
            Filtres avancés {hasActiveFilters && `(${Object.values(filters).filter((f) => f !== "").length})`}
          </Button>

          {hasActiveFilters && (
            <Button variant="outline-danger" size="sm" onClick={clearAllFilters} className="clear-filters-btn">
              <XCircleFill size={14} />
              Effacer tous les filtres
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="advanced-filters animate-fadeInUp">
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">ID Batch</label>
                <input
                  type="text"
                  placeholder="Filtrer par ID..."
                  value={filters.id}
                  onChange={(e) => handleFilterChange("id", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Date</label>
                <input
                  type="text"
                  placeholder="Filtrer par date..."
                  value={filters.date}
                  onChange={(e) => handleFilterChange("date", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Période de paiement</label>
                <input
                  type="text"
                  placeholder="Filtrer par période (ex: janvier 2024)..."
                  value={filters.periodePaiement}
                  onChange={(e) => handleFilterChange("periodePaiement", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Total</label>
                <input
                  type="text"
                  placeholder="Filtrer par total..."
                  value={filters.total}
                  onChange={(e) => handleFilterChange("total", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Chèque</label>
                <select
                  value={filters.chequePdf}
                  onChange={(e) => handleFilterChange("chequePdf", e.target.value)}
                  className="filter-input"
                >
                  <option value="">Tous</option>
                  <option value="oui">Avec chèque</option>
                  <option value="non">Sans chèque</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Reçu</label>
                <select
                  value={filters.recuPdf}
                  onChange={(e) => handleFilterChange("recuPdf", e.target.value)}
                  className="filter-input"
                >
                  <option value="">Tous</option>
                  <option value="oui">Avec reçu</option>
                  <option value="non">Sans reçu</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Code Immeuble</label>
                <input
                  type="text"
                  placeholder="Filtrer par code..."
                  value={filters.codeImmeuble}
                  onChange={(e) => handleFilterChange("codeImmeuble", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Province</label>
                <input
                  type="text"
                  placeholder="Filtrer par province..."
                  value={filters.province}
                  onChange={(e) => handleFilterChange("province", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Quartier</label>
                <input
                  type="text"
                  placeholder="Filtrer par quartier..."
                  value={filters.quartier}
                  onChange={(e) => handleFilterChange("quartier", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Propriété</label>
                <input
                  type="text"
                  placeholder="Filtrer par propriété..."
                  value={filters.nomPropriete}
                  onChange={(e) => handleFilterChange("nomPropriete", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">RG</label>
                <input
                  type="text"
                  placeholder="Filtrer par RG..."
                  value={filters.rg}
                  onChange={(e) => handleFilterChange("rg", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Adresse</label>
                <input
                  type="text"
                  placeholder="Filtrer par adresse..."
                  value={filters.adresse}
                  onChange={(e) => handleFilterChange("adresse", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Localisation</label>
                <input
                  type="text"
                  placeholder="Filtrer par localisation..."
                  value={filters.localisation}
                  onChange={(e) => handleFilterChange("localisation", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Type Compteur</label>
                <select
                  value={filters.typeCompteur}
                  onChange={(e) => handleFilterChange("typeCompteur", e.target.value)}
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
                  onChange={(e) => handleFilterChange("numeroCompteur", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">N° Facture</label>
                <input
                  type="text"
                  placeholder="Filtrer par facture..."
                  value={filters.numeroFacture}
                  onChange={(e) => handleFilterChange("numeroFacture", e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Montant</label>
                <input
                  type="text"
                  placeholder="Filtrer par montant..."
                  value={filters.montant}
                  onChange={(e) => handleFilterChange("montant", e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-state animate-fade-in">
            <div className="spinner-border text-success" />
            <p>Chargement de l'historique...</p>
          </div>
        ) : (
          <div className="table-wrapper animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date et Heure</th>
                  <th>Période de paiement</th>
                  <th>Total</th>
                  <th>Chèque</th>
                  <th>Reçu</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="empty-state animate-fade-in">
                        <ClockHistory size={48} className="text-muted mb-3" />
                        <p className="text-muted">Aucun historique de paiement trouvé</p>
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
                  filteredBatches.map((b, index) => (
                    <tr key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
                      <td>
                        <span className="badge-id">{b.id}</span>
                      </td>
                      <td>
                        {new Date(b.date).toLocaleString("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>
                        <strong>{formatPeriodePaiement(b)}</strong>
                      </td>
                      <td>
                        <strong className="text-success">{formatMontantFR(b.total)}</strong>
                      </td>
                      <td>
                        {b.chequePdf ? (
                          <span className="badge bg-success">Oui</span>
                        ) : (
                          <span className="badge bg-secondary">Non</span>
                        )}
                      </td>
                      <td>
                        {b.recuPdf ? (
                          <span className="badge bg-success">Oui</span>
                        ) : (
                          <span className="badge bg-secondary">Non</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id={`tooltip-view-${b.id}`} className="custom-tooltip">
                                Afficher les détails
                              </Tooltip>
                            }
                          >
                            <span>
                              <Link to={`/historique/${b.id}`} className="btn btn-primary btn-sm" style={{ background: "#0d9488" }}>
                                <EyeFill size={16} />
                              </Link>
                            </span>
                          </OverlayTrigger>

                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id={`tooltip-download-${b.id}`} className="custom-tooltip">
                                Télécharger le PDF
                              </Tooltip>
                            }
                          >
                            <button className="btn btn-success btn-sm" onClick={() => handleDownloadPdf(b.id)} style={{ background: "#0d9488" }}>
                              <FileEarmarkPdfFill size={16} />
                            </button>
                          </OverlayTrigger>

                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id={`tooltip-delete-${b.id}`} className="custom-tooltip">
                                Supprimer
                              </Tooltip>
                            }
                          >
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(b)}>
                              <TrashFill size={16} />
                            </button>
                          </OverlayTrigger>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
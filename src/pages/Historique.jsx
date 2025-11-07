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
import "../styles/animations.css"

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
        message={`Êtes-vous sûr de vouloir supprimer l'historique du paiement #${batchToDelete?.id} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      <div className="page-container">
        <div className="page-header animate-fade-in-down">
          <div className="page-header-content animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="page-icon" style={{ background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)" }}>
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
                  <th>Date</th>
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

      <style>{`
        .page-container {
          padding: 32px 24px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .page-header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .page-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
        }

        .page-title {
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
        }

        .page-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

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
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
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
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
        }

        .stats-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 24px;
          border-radius: 12px;
          color: white;
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
        }

        .stats-number {
          font-size: 32px;
          font-weight: 800;
          line-height: 1;
        }

        .stats-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.9;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          gap: 16px;
        }

        .loading-state p {
          color: #6b7280;
          font-size: 15px;
        }

        .table-wrapper {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow-x: auto;
        }

        .table {
          margin: 0;
          width: 100%;
        }

        .empty-state {
          padding: 40px;
          text-align: center;
        }

        .badge-id {
          background: #f3f4f6;
          color: #6b7280;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        /* Styles personnalisés pour les tooltips */
        .custom-tooltip {
          font-size: 13px !important;
          font-weight: 500 !important;
          letter-spacing: 0.3px !important;
          border-radius: 6px !important;
        }

        .custom-tooltip .tooltip-inner {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%) !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
        }

        .custom-tooltip.bs-tooltip-top .tooltip-arrow::before {
          border-top-color: #1f2937 !important;
        }

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

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in-down {
          animation: fadeInDown 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }

        /* Smooth hover effects for table rows */
        .table tbody tr {
          transition: all 0.3s ease;
        }

        .table tbody tr:hover {
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        @media (max-width: 768px) {
          .page-container {
            padding: 24px 16px;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .page-header-content {
            width: 100%;
          }

          .page-icon {
            width: 48px;
            height: 48px;
          }

          .page-title {
            font-size: 24px;
          }

          .stats-badge {
            width: 100%;
          }

          .table-wrapper {
            border-radius: 8px;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }

          .filters-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  )
}
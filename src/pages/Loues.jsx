"use client"

import { useEffect, useState } from "react"
import { getCompteurs } from "../services/api"
import { HouseFill, Search, XCircleFill, Filter } from "react-bootstrap-icons"
import { Button } from "react-bootstrap"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import "../styles/animations.css"

export default function Loues() {
  const [compteurs, setCompteurs] = useState([])
  const [searchText, setSearchText] = useState("")
  const [loading, setLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    codeImmeuble: "",
    codeLocal: "",
    province: "",
    quartier: "",
    nomPropriete: "",
    rg: "",
    typeBien: "",
    adresse: "",
    localisation: "",
    numeroCompteur: ""
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getCompteurs(true) // loués

        // On garde tous les champs principaux et les sous-compteurs
        const processedData = data.map((c) => ({
          id: c.id,
          codeImmeuble: c.codeImmeuble || "",
          codeLocal: c.codeLocal || "",
          nomPropriete: c.nomPropriete || "",
          rg: c.rg || "",
          typeBien: c.typeBien || "",
          province: c.province || "",
          adresse: c.adresse || "",
          quartier: c.quartier || "",
          localisation: c.localisation || "",
          typeCompteur: c.typeCompteur || "eau",
          sousCompteurs: c.sousCompteurs?.map((s) => ({
            id: s.id,
            numeroCompteur: s.numeroCompteur || "",
            typeCompteur: s.typeCompteur || "eau",
          })) || [],
        }))

        setCompteurs(processedData)
      } catch (err) {
        addToast(err.message, "error")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
      codeLocal: "",
      province: "",
      quartier: "",
      nomPropriete: "",
      rg: "",
      typeBien: "",
      adresse: "",
      localisation: "",
      numeroCompteur: ""
    })
  }

  // Filtrage combiné (recherche globale + filtres individuels)
  const filteredCompteurs = compteurs
    .filter((c) => {
      // Filtre de recherche globale (existant)
      const text = searchText.toLowerCase()
      const mainFields = [
        c.codeImmeuble,
        c.codeLocal,
        c.nomPropriete,
        c.rg,
        c.typeBien,
        c.province,
        c.adresse,
        c.quartier,
        c.localisation,
      ]
      const mainMatch = mainFields.some((f) => f?.toLowerCase().includes(text))
      const sousMatch = c.sousCompteurs?.some((s) => s.numeroCompteur.toLowerCase().includes(text))
      const globalSearchMatch = searchText === "" || mainMatch || sousMatch

      // Filtres individuels
      const individualFiltersMatch =
        (filters.codeImmeuble === "" || c.codeImmeuble?.toLowerCase().includes(filters.codeImmeuble.toLowerCase())) &&
        (filters.codeLocal === "" || c.codeLocal?.toLowerCase().includes(filters.codeLocal.toLowerCase())) &&
        (filters.province === "" || c.province?.toLowerCase().includes(filters.province.toLowerCase())) &&
        (filters.quartier === "" || c.quartier?.toLowerCase().includes(filters.quartier.toLowerCase())) &&
        (filters.nomPropriete === "" || c.nomPropriete?.toLowerCase().includes(filters.nomPropriete.toLowerCase())) &&
        (filters.rg === "" || c.rg?.toLowerCase().includes(filters.rg.toLowerCase())) &&
        (filters.typeBien === "" || c.typeBien?.toLowerCase().includes(filters.typeBien.toLowerCase())) &&
        (filters.adresse === "" || c.adresse?.toLowerCase().includes(filters.adresse.toLowerCase())) &&
        (filters.localisation === "" || c.localisation?.toLowerCase().includes(filters.localisation.toLowerCase())) &&
        (filters.numeroCompteur === "" || c.sousCompteurs?.some(s => s.numeroCompteur.toLowerCase().includes(filters.numeroCompteur.toLowerCase())))

      return globalSearchMatch && individualFiltersMatch
    })
    .sort((a, b) => {
      // Tri alphabétique du quartier, insensible à la casse
      return a.quartier.localeCompare(b.quartier, undefined, { sensitivity: 'base' })
    })

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = Object.values(filters).some(filter => filter !== "")

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="page-container animate-fadeInUp">
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-icon" style={{ background: "linear-gradient(135deg, #22c55e 0%, #0790bdff 100%)" }}>
              <HouseFill size={28} />
            </div>
            <div>
              <h2 className="page-title">Compteurs loués</h2>
              <p className="page-subtitle">Liste des compteurs actuellement loués</p>
            </div>
          </div>
          <div className="stats-badge">
            <span className="stats-number">{filteredCompteurs.length}</span>
            <span className="stats-label">Compteurs</span>
          </div>
        </div>

        {/* Recherche globale existante */}
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par code, propriété, adresse, compteur..."
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
                <label className="filter-label">Code Local</label>
                <input
                  type="text"
                  placeholder="Filtrer par code..."
                  value={filters.codeLocal}
                  onChange={(e) => handleFilterChange('codeLocal', e.target.value)}
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
                <label className="filter-label">Type Bien</label>
                <select
                  value={filters.typeBien}
                  onChange={(e) => handleFilterChange('typeBien', e.target.value)}
                  className="filter-input"
                >
                  <option value="">Tous les types</option>
                  <option value="placement">Placement</option>
                  <option value="exploitation">Exploitation</option>
                </select>
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
                <label className="filter-label">N° Compteur</label>
                <input
                  type="text"
                  placeholder="Filtrer par compteur..."
                  value={filters.numeroCompteur}
                  onChange={(e) => handleFilterChange('numeroCompteur', e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner-border text-success" />
            <p>Chargement des compteurs...</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Code Immeuble</th>
                  <th>Code Local</th>
                  <th>Province</th>
                  <th>Quartier</th>
                  <th>Propriété</th>
                  <th>RG</th>
                  <th>Localisation</th>
                  <th>N° Compteurs</th>
                </tr>
              </thead>
              <tbody className="scrollable-tbody">
                {filteredCompteurs.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5">
                      <div className="empty-state">
                        <HouseFill size={48} className="text-muted mb-3" />
                        <p className="text-muted">Aucun compteur loué trouvé</p>
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
                  filteredCompteurs.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.codeImmeuble}</strong></td>
                      <td><strong>{c.codeLocal}</strong></td>
                      <td>{c.province}</td>
                      <td>{c.quartier}</td>
                      <td>{c.nomPropriete}</td>
                      <td>{c.rg}</td>
                      <td>{c.localisation}</td>
                      <td>
                        <div className="compteurs-list">
                          {c.sousCompteurs && c.sousCompteurs.length > 0 ? (
                            c.sousCompteurs.map((s) => (
                              <span key={s.id} className={`compteur-badge ${s.typeCompteur}`}>
                                {s.numeroCompteur}({s.typeCompteur})
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">Aucun numéro de compteur</span>
                          )}
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
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(8px);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .table-wrapper {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    overflow-x: auto;
    /* Nouvelles propriétés pour le défilement vertical */
    height: 700px;
    display: flex;
    flex-direction: column;
  }

  /* Styles pour le tableau avec défilement */
  .table {
    margin: 0;
    min-width: 1000px;
    text-align: center;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  thead {
    flex-shrink: 0;
    display: table;
    width: 100%;
    table-layout: fixed;
  }

  tbody.scrollable-tbody {
    flex: 1;
    overflow-y: auto;
    display: block;
  }

  tbody.scrollable-tbody tr {
    display: table;
    width: 100%;
    table-layout: fixed;
  }

  th {
    background: linear-gradient(135deg, #59edd9ff 0%, #089683ff 100%) !important;
    padding: 12px 8px;
    border: 1px solid rgba(221, 221, 221, 0.4);
    font-weight: 600;
    color: #1a1a1a;
    position: sticky;
    top: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  td {
    background-color: white;
    padding: 8px;
    border: 1px solid #ddd;
    vertical-align: middle;
    word-wrap: break-word;
    overflow: hidden;
  }

  /* Personnalisation de la barre de défilement */
  .scrollable-tbody::-webkit-scrollbar {
    width: 10px;
  }

  .scrollable-tbody::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  .scrollable-tbody::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #22c55e 0%, #0790bdff 100%);
    border-radius: 4px;
  }

  .scrollable-tbody::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #16a34a 0%, #0284c7 100%);
  }

  /* Pour Firefox */
  .scrollable-tbody {
    scrollbar-width: thin;
    scrollbar-color: #22c55e rgba(0, 0, 0, 0.1);
  }

  /* Effet de survol pour mieux voir les lignes */
  tbody tr:hover td {
    background-color: rgba(255, 255, 255, 0.9) !important;
    transition: background-color 0.2s ease;
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
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
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
    border: 1px solid #d1d5db;
  }

  .filter-toggle-btn:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  .clear-filters-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid #fca5a5;
    color: #dc2626;
  }

  .clear-filters-btn:hover {
    background-color: #fef2f2;
    border-color: #dc2626;
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
    border-color: #0d9488;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
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

  .badge-type {
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
    display: inline-block;
  }

  .badge-type.placement {
    background: #dbeafe;
    color: #1e40af;
  }

  .badge-type.exploitation {
    background: #fef3c7;
    color: #92400e;
  }

  .badge-type.eau {
    background: #6685aeff;
    color: #061957ff;
  }

  .badge-type.électricité {
    background: #ed966eff;
    color: #431c04ff;
  }

  .compteurs-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
  }

  .compteur-badge {
    background: #dcfce7;
    color: #166534;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  .stats-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(135deg, #0d9488 0%, #0d9488 100%);
    padding: 16px 24px;
    border-radius: 12px;
    color: white;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
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

  .text-muted {
    color: #6b7280 !important;
    font-style: italic;
    font-size: 12px;
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
      height: 600px;
    }

    .filters-grid {
      grid-template-columns: 1fr;
    }

    .filters-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  @media (max-width: 480px) {
    .table-wrapper {
      height: 500px;
    }
    
    .page-container {
      padding: 16px 12px;
    }
    
    .stats-badge {
      padding: 12px 16px;
    }
    
    .stats-number {
      font-size: 24px;
    }
  }
`}</style>
    </>
  )
}
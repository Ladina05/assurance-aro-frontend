"use client"

import { useEffect, useState } from "react"
import { getCompteurs } from "../services/api"
import { HouseFill, Search, XCircleFill, Filter } from "react-bootstrap-icons"
import { Button } from "react-bootstrap"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
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
    </>
  )
}
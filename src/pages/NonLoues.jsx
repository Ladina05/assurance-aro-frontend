"use client"

import { useEffect, useState } from "react"
import { getCompteurs, updateSousCompteur, payBatch } from "../services/api"
import { Modal, Button, Form } from "react-bootstrap"
import {
  HouseSlashFill,
  Search,
  XCircleFill,
  PlusCircleFill,
  TrashFill,
  CashStack,
  PencilSquare,
  Filter
} from "react-bootstrap-icons"
import ConfirmDialog from "../components/ConfirmDialog"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import "../styles/animations.css"

export default function NonLoues() {
  const [compteurs, setCompteurs] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [currentCompteur, setCurrentCompteur] = useState(null)
  const [form, setForm] = useState({ numeroFacture: "", montant: "", selectedCompteur: "tous" })
  const [searchText, setSearchText] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPayConfirm, setShowPayConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const { toasts, addToast, removeToast } = useToast()
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    codeImmeuble: "",
    province: "",
    quartier: "",
    nomPropriete: "",
    rg: "",
    typeBien: "",
    adresse: "",
    localisation: "",
    numeroCompteur: "",
    numeroFacture: "",
    montant: ""
  })

  const formatMontant = (valeur) => {
    if (typeof valeur !== "number") return "-"
    return valeur.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  async function load() {
    setLoading(true)
    try {
      const data = await getCompteurs(false) // Récupère les compteurs non loués
      const processedData = data.map((c) => ({
        id: c.id,
        codeImmeuble: c.codeImmeuble || "",
        nomPropriete: c.nomPropriete || "",
        rg: c.rg || "",
        typeBien: c.typeBien || "",
        province: c.province || "",
        adresse: c.adresse || "",
        quartier: c.quartier || "",
        localisation: c.localisation || "",
        loue: c.loue || false,
        sousCompteurs:
          c.sousCompteurs?.map((s) => ({
            id: s.id,
            numeroCompteur: s.numeroCompteur || "",
            typeCompteur: s.typeCompteur || "eau",
            numeroFacture: s.numeroFacture || null,
            montant: s.montant || null,
          })) || [],
      }))
      setCompteurs(processedData)
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleShowModal = (compteur) => {
    setCurrentCompteur(compteur)
    setForm({ numeroFacture: "", montant: "", selectedCompteur: "tous" })
    setShowModal(true)
  }

  const handleCloseModal = () => setShowModal(false)

  const handleSubmit = async () => {
    if (!form.numeroFacture && !form.montant) {
      addToast("Veuillez remplir au moins N° Facture ou Montant", "warning")
      return
    }

    try {
      if (form.selectedCompteur === "tous") {
        const totalMontant = Number(form.montant)
        const nb = currentCompteur.sousCompteurs.length
        if (nb === 0) return

        // Calcul du montant exact par compteur avec arrondi à 2 décimales
        const montantParCompteur = Number((totalMontant / nb).toFixed(2))

        // Ajuster le dernier pour corriger les centimes perdus
        let sommeAttribuee = 0
        const updates = currentCompteur.sousCompteurs.map((s, index) => {
          let montantFinal = montantParCompteur
          sommeAttribuee += montantFinal
          // Pour le dernier compteur, ajuster si nécessaire
          if (index === nb - 1) {
            montantFinal = Number((totalMontant - (sommeAttribuee - montantFinal)).toFixed(2))
          }
          return updateSousCompteur(s.id, {
            numeroFacture: form.numeroFacture || null,
            montant: montantFinal,
          })
        })

        await Promise.all(updates)
      } else {
        await updateSousCompteur(form.selectedCompteur, {
          numeroFacture: form.numeroFacture || null,
          montant: form.montant ? Number(form.montant) : null,
        })
      }

      addToast("Facture ajoutée avec succès", "success")
      load()
      handleCloseModal()
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const totalMontant = compteurs.reduce(
    (acc, c) =>
      acc +
      c.sousCompteurs.reduce((sum, s) => sum + (typeof s.montant === "number" ? s.montant : 0), 0),
    0
  )

  const handlePayBatch = async () => {
    const payables = compteurs
      .flatMap((c) => c.sousCompteurs)
      .filter((s) => typeof s.montant === "number" && s.montant > 0)

    if (payables.length === 0) {
      addToast("Aucun montant à payer", "warning")
      return
    }

    try {
      await payBatch(payables)
      addToast("Paiement effectué avec succès", "success")
      load()
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setShowPayConfirm(false)
    }
  }

  const handleDeleteClick = (sousCompteur) => {
    setItemToDelete(sousCompteur)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    try {
      if (!itemToDelete) return;

      // Récupère le compteur parent de ce sous-compteur
      const compteurParent = compteurs.find(c =>
        c.sousCompteurs.some(sc => sc.id === itemToDelete.id)
      );

      if (!compteurParent) return;

      // Mettre à jour tous les sous-compteurs du compteur pour supprimer facture et montant
      const updates = compteurParent.sousCompteurs.map((sc) =>
        updateSousCompteur(sc.id, { numeroFacture: null, montant: null })
      );

      await Promise.all(updates);

      addToast("Toutes les factures et montants de ce compteur ont été supprimés", "success");
      load();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

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
      typeBien: "",
      adresse: "",
      localisation: "",
      numeroCompteur: "",
      numeroFacture: "",
      montant: ""
    })
  }

  // Filtrage combiné (recherche globale + filtres individuels)
  const filteredCompteurs = compteurs
    .filter((c) => {
      // Filtre de recherche globale (existant)
      const text = searchText.toLowerCase()
      const mainFields = [
        c.codeImmeuble,
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
        (filters.province === "" || c.province?.toLowerCase().includes(filters.province.toLowerCase())) &&
        (filters.quartier === "" || c.quartier?.toLowerCase().includes(filters.quartier.toLowerCase())) &&
        (filters.nomPropriete === "" || c.nomPropriete?.toLowerCase().includes(filters.nomPropriete.toLowerCase())) &&
        (filters.rg === "" || c.rg?.toLowerCase().includes(filters.rg.toLowerCase())) &&
        (filters.typeBien === "" || c.typeBien?.toLowerCase().includes(filters.typeBien.toLowerCase())) &&
        (filters.adresse === "" || c.adresse?.toLowerCase().includes(filters.adresse.toLowerCase())) &&
        (filters.localisation === "" || c.localisation?.toLowerCase().includes(filters.localisation.toLowerCase())) &&
        (filters.numeroCompteur === "" || c.sousCompteurs?.some(s => s.numeroCompteur.toLowerCase().includes(filters.numeroCompteur.toLowerCase()))) &&
        (filters.numeroFacture === "" || c.sousCompteurs?.some(s => s.numeroFacture?.toLowerCase().includes(filters.numeroFacture.toLowerCase()))) &&
        (filters.montant === "" || c.sousCompteurs?.some(s => s.montant?.toString().includes(filters.montant)))

      return globalSearchMatch && individualFiltersMatch
    })
    .sort((a, b) => a.quartier.localeCompare(b.quartier, undefined, { sensitivity: "base" }))

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = Object.values(filters).some(filter => filter !== "")

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <ConfirmDialog
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Supprimer la facture"
        message="Êtes-vous sûr de vouloir supprimer cette facture et son montant ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      <ConfirmDialog
        show={showPayConfirm}
        onHide={() => setShowPayConfirm(false)}
        onConfirm={handlePayBatch}
        title="Confirmer le paiement"
        message={`Êtes-vous sûr de vouloir effectuer le paiement de ${formatMontant(totalMontant)} ?`}
        confirmText="Payer"
        cancelText="Annuler"
        variant="success"
      />

      <div className="page-container animate-fadeInUp">
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-icon" style={{ background: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)" }}>
              <HouseSlashFill size={28} />
            </div>
            <div>
              <h2 className="page-title">Compteurs libres</h2>
              <p className="page-subtitle">Gérer les compteurs libres et leurs factures</p>
            </div>
          </div>
          <div className="total-card">
            <div className="total-label">Total à payer</div>
            <div className="total-amount">{formatMontant(totalMontant)} Ar</div>
            <Button
              variant="success"
              size="sm"
              onClick={() => setShowPayConfirm(true)}
              disabled={totalMontant === 0}
              className="mt-2"
            >
              <CashStack size={16} className="me-1" />
              Payer
            </Button>
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
                  <th>Province</th>
                  <th>Quartier</th>
                  <th>Propriété</th>
                  <th>RG</th>
                  <th>Type Bien</th>
                  <th>Adresse</th>
                  <th>Localisation</th>
                  <th>N° Compteur</th>
                  <th>N° Facture</th>
                  <th>Montant (Ar)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompteurs.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="text-center py-5">
                      <div className="empty-state">
                        <HouseSlashFill size={48} className="text-muted mb-3" />
                        <p className="text-muted">Aucun compteur libre trouvé</p>
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
                  filteredCompteurs.map((c) => {
                    // Vérifie si "tous" a été utilisé : tous les sousCompteurs ont le même numeroFacture et montant
                    const isTous = c.sousCompteurs.every(
                      (sc) =>
                        sc.numeroFacture === c.sousCompteurs[0].numeroFacture
                    )

                    // Somme totale des montants pour le cas "tous"
                    const totalMontantTous = c.sousCompteurs.reduce(
                      (sum, sc) => sum + (typeof sc.montant === "number" ? sc.montant : 0),
                      0
                    )

                    return (
                      <tr key={c.id}>
                        <td><strong>{c.codeImmeuble}</strong></td>
                        <td>{c.province}</td>
                        <td>{c.quartier}</td>
                        <td>{c.nomPropriete}</td>
                        <td>{c.rg}</td>
                        <td><span className={`badge-type ${c.typeBien}`}>{c.typeBien}</span></td>
                        <td>{c.adresse}</td>
                        <td>{c.localisation}</td>

                        {/* N° Compteur */}
                        <td>
                          <div className="compteurs-list">
                            {c.sousCompteurs.map((sc, idx) => (
                              <div key={idx} className="compteur-line">
                                {sc.numeroCompteur} ({sc.typeCompteur})
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* N° Facture */}
                        <td>
                          <div className="compteurs-list">
                            {isTous ? (
                              <div style={{ textAlign: 'center' }}>{c.sousCompteurs[0].numeroFacture || "-"}</div>
                            ) : (
                              c.sousCompteurs.map((sc, idx) => (
                                <div key={idx} className="compteur-line">{sc.numeroFacture || "-"}</div>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Montant */}
                        <td>
                          <div className="compteurs-list">
                            {isTous ? (
                              <div style={{ textAlign: 'center' }}>
                                <strong className="text-success">{formatMontant(totalMontantTous)}</strong>
                              </div>
                            ) : (
                              c.sousCompteurs.map((sc, idx) => (
                                <div key={idx} className="compteur-line">
                                  <strong className="text-success">{sc.montant != null ? formatMontant(sc.montant) : "-"}</strong>
                                </div>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="action-buttons">
                            <Button variant="primary" size="sm" onClick={() => handleShowModal(c)}>
                              <PlusCircleFill size={16} />
                            </Button>
                            {c.sousCompteurs.some((sc) => sc.numeroFacture || sc.montant) && (
                              <Button variant="danger" size="sm" onClick={() => handleDeleteClick(c.sousCompteurs[0])}>
                                <TrashFill size={16} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Ajouter N° Facture / Montant</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Attribuer à</Form.Label>
                <Form.Select
                  value={form.selectedCompteur}
                  onChange={(e) => setForm({ ...form, selectedCompteur: e.target.value })}
                >
                  <option value="tous">Tous les compteurs</option>
                  {currentCompteur?.sousCompteurs?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.numeroCompteur} ({s.typeCompteur})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>N° Facture</Form.Label>
                <Form.Control
                  type="text"
                  value={form.numeroFacture}
                  onChange={(e) => setForm({ ...form, numeroFacture: e.target.value })}
                  placeholder="Entrez le numéro de facture"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Montant (Ar)</Form.Label>
                <Form.Control
                  type="number"
                  value={form.montant}
                  onChange={(e) => setForm({ ...form, montant: e.target.value })}
                  placeholder="Entrez le montant"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Valider
            </Button>
          </Modal.Footer>
        </Modal>
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
          box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);
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
          min-width: 1400px;
        }

        .empty-state {
          padding: 40px;
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

        .compteur-badge {
          background: #dcfce7;
          color: #166534;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .total-card {
          background: white;
          padding: 20px 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          text-align: center;
          border: 2px solid #dcfce7;
        }

        .compteur-line {
          margin-bottom: 4px; /* espace entre les lignes */
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .total-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .total-amount {
          font-size: 28px;
          font-weight: 800;
          color: #16a34a;
          margin-bottom: 8px;
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

          .total-card {
            width: 100%;
          }

          .total-amount {
            font-size: 24px;
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
        }
      `}</style>
    </>
  )
}
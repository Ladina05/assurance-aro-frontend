"use client"

import { useEffect, useState } from "react"
import { getCompteurs, updateSousCompteur, payBatch } from "../services/api"
import { Modal, Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap"
import {
  HouseSlashFill,
  Search,
  XCircleFill,
  PlusCircleFill,
  TrashFill,
  CashStack,
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
    codeLocal: "",
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

  const [moisPaiement, setMoisPaiement] = useState(new Date().getMonth() + 1)
  const [anneePaiement, setAnneePaiement] = useState(new Date().getFullYear())

  const formatMontant = (montant) => {
    if (montant == null) return "-"
    return (
      montant
        .toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        .replace(/\u202F/g, "  ")
    )
  }

  async function load() {
    setLoading(true);
    try {
      const data = await getCompteurs(false); // Récupère les compteurs non loués

      // Vérification et nettoyage des données
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
        loue: c.loue || false,
        sousCompteurs: Array.isArray(c.sousCompteurs)
          ? c.sousCompteurs.map((s) => ({
            id: s.id,
            numeroCompteur: s.numeroCompteur || "",
            typeCompteur: s.typeCompteur || "eau",
            numeroFacture: s.numeroFacture || null,
            montant: s.montant || null,
          }))
          : [] // Garantir que c'est toujours un tableau
      }));

      setCompteurs(processedData);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      addToast(err.message, "error");
    } finally {
      setLoading(false);
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
      addToast("Veuillez remplir tous les champs", "warning")
      return
    }

    // Vérifier si on essaie d'ajouter une facture à un compteur sans sous-compteur
    if (currentCompteur && currentCompteur.sousCompteurs.length === 0) {
      addToast("Impossible d'ajouter une facture : ce compteur n'a pas de sous-compteur", "error")
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
      await payBatch(moisPaiement, anneePaiement)
      addToast(`Paiement effectué avec succès pour ${getNomMois(moisPaiement)} ${anneePaiement}`, "success")
      load()
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setShowPayConfirm(false)
    }
  }

  // Fonction pour regrouper les paiements par numéro de facture (comme dans le PDF)
  const getGroupedPayments = () => {
    try {
      const allPayments = compteurs.flatMap(c => {
        // Vérifier que c.sousCompteurs existe et est un tableau
        if (!c.sousCompteurs || !Array.isArray(c.sousCompteurs)) {
          return [];
        }

        return c.sousCompteurs
          .filter(s => s && typeof s.montant === 'number' && s.montant > 0)
          .map(s => ({
            ...s,
            compteur: {
              province: c.province || 'N/A',
              quartier: c.quartier || 'N/A',
              adresse: c.adresse || '-',
              rg: c.rg || '-'
            }
          }));
      });

      // Si aucun paiement, retourner un tableau vide
      if (allPayments.length === 0) {
        return [];
      }

      // Regrouper par numeroFacture comme dans le PDF
      const groupedPayments = Object.values(
        allPayments.reduce((acc, p) => {
          if (!p || !p.id) return acc; // Éviter les éléments undefined ou sans ID

          const key = p.numeroFacture || `nofacture-${p.id}`;
          if (!acc[key]) {
            acc[key] = {
              ...p,
              typeCompteur: [p.typeCompteur || 'eau'],
              numeroCompteur: [p.numeroCompteur || ''],
              montant: p.montant || 0,
              province: p.compteur?.province || 'N/A',
              quartier: p.compteur?.quartier || 'N/A',
              adresse: p.compteur?.adresse || '-',
              rg: p.compteur?.rg || '-'
            };
          } else {
            acc[key].typeCompteur.push(p.typeCompteur || 'eau');
            acc[key].numeroCompteur.push(p.numeroCompteur || '');
            acc[key].montant += p.montant || 0;
          }
          return acc;
        }, {})
      );

      // Trier par quartier comme dans le PDF
      return groupedPayments.sort((a, b) => {
        const q1 = a.quartier?.toLowerCase() || '';
        const q2 = b.quartier?.toLowerCase() || '';
        return q1.localeCompare(q2);
      });
    } catch (error) {
      console.error('Erreur dans getGroupedPayments:', error);
      return [];
    }
  };

  const getNomMois = (mois) => {
    const nomsMois = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ]
    return nomsMois[mois - 1]
  }

  const handleDeleteClick = (sousCompteur) => {
    if (!sousCompteur || !sousCompteur.id) {
      addToast("Impossible de supprimer : sous-compteur invalide", "error");
      return;
    }
    setItemToDelete(sousCompteur);
    setShowDeleteConfirm(true);
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
      codeLocal: "",
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

      <Modal
        show={showPayConfirm}
        onHide={() => setShowPayConfirm(false)}
        size="xl"
        dialogClassName="custom-payment-modal"
        centered
      >
        <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #22c59fff 0%, #0790bdff 100%)" }}>
          <Modal.Title>Confirmer le paiement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <p>Êtes-vous sûr de vouloir effectuer le paiement de <strong>{formatMontant(totalMontant)} Ar</strong> pour le mois de: <strong>{getNomMois(moisPaiement)} {anneePaiement}</strong> ?</p>

            {/* Tableau récapitulatif */}
            <div className="recap-table-container">
              <h6 className="recap-title">Détail des paiements</h6>
              <div className="table-responsive">
                <table className="recap-table">
                  <thead>
                    <tr>
                      <th>Province</th>
                      <th>Quartier</th>
                      <th>Adresse</th>
                      <th>RG</th>
                      <th>Type</th>
                      <th>N° Facture</th>
                      <th>Montant (Ar)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getGroupedPayments().map((paiement, index) => (
                      <tr key={index}>
                        <td>{paiement.province || 'N/A'}</td>
                        <td>{paiement.quartier}</td>
                        <td>{paiement.adresse || '-'}</td>
                        <td>{paiement.rg || '-'}</td>
                        <td>{paiement.typeCompteur.join(' / ')}</td>
                        <td>{paiement.numeroFacture || 'N/A'}</td>
                        <td className="text-end">{formatMontant(paiement.montant)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="recap-total">
                      <td colSpan="6" className="text-end"><strong>TOTAL GÉNÉRAL</strong></td>
                      <td className="text-end"><strong>{formatMontant(totalMontant)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowPayConfirm(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={handlePayBatch}
            style={{ background: "linear-gradient(135deg, #22c55e 0%, #0790bdff 100%)" }}>
            Payer
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="page-container animate-fadeInUp">
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-icon" style={{ background: "linear-gradient(135deg, #0af392ff 0%, #04887fff 100%)" }}>
              <HouseSlashFill size={28} />
            </div>
            <div>
              <h2 className="page-title">Compteurs libres</h2>
              <p className="page-subtitle">Gérer les compteurs libres et leurs factures</p>
            </div>
          </div>
          <div className="total-card">
            <div className="total-label">Total à payer</div>
            <div className="total-amount"
              style={{ color: "linear-gradient(135deg, #22c55e 0%, #0790bdff 100%)" }}>
              {formatMontant(totalMontant)} Ar</div>
            {/* Sélecteurs pour le mois et l'année de paiement */}
            <div className="paiement-date-selectors">
              <div className="date-selector-group">
                <label className="date-label">Mois de paiement</label>
                <select
                  value={moisPaiement}
                  onChange={(e) => setMoisPaiement(parseInt(e.target.value))}
                  className="date-select"
                >
                  <option value={1}>Janvier</option>
                  <option value={2}>Février</option>
                  <option value={3}>Mars</option>
                  <option value={4}>Avril</option>
                  <option value={5}>Mai</option>
                  <option value={6}>Juin</option>
                  <option value={7}>Juillet</option>
                  <option value={8}>Août</option>
                  <option value={9}>Septembre</option>
                  <option value={10}>Octobre</option>
                  <option value={11}>Novembre</option>
                  <option value={12}>Décembre</option>
                </select>
              </div>

              <div className="date-selector-group">
                <label className="date-label">Année de paiement</label>
                <input
                  type="number"
                  value={anneePaiement}
                  placeholder="Ex: 2024"
                  onChange={(e) => setAnneePaiement(parseInt(e.target.value))}
                  className="date-select"
                />
              </div>
            </div>
            <Button
              variant="success"
              size="sm"
              onClick={() => setShowPayConfirm(true)}
              disabled={totalMontant === 0}
              className="mt-2"
              style={{ background: "linear-gradient(135deg, #22c55e 0%, #0790bdff 100%)" }}
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
                <label className="filter-label">Code Local</label>
                <input
                  type="text"
                  placeholder="Filtrer par code..."
                  value={filters.codeLocal}
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
            <table className="table main-table">
              <thead>
                <tr>
                  <th>Code Immeuble</th>
                  <th>Code Local</th>
                  <th>Quartier</th>
                  <th>Propriété</th>
                  <th>RG</th>
                  <th>Localisation</th>
                  <th>N° Compteur</th>
                  <th>N° Facture</th>
                  <th>Montant (Ar)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="table-body-scroll">
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
                    // CORRECTION : Vérifier d'abord qu'il y a des sous-compteurs
                    const hasSousCompteurs = c.sousCompteurs && c.sousCompteurs.length > 0;

                    const isTous = hasSousCompteurs && c.sousCompteurs.every(
                      (sc, index, array) =>
                        sc.numeroFacture === array[0].numeroFacture
                    )

                    // Somme totale des montants pour le cas "tous"
                    const totalMontantTous = hasSousCompteurs ? c.sousCompteurs.reduce(
                      (sum, sc) => sum + (typeof sc.montant === "number" ? sc.montant : 0),
                      0
                    ) : 0;

                    return (
                      <tr key={c.id}>
                        <td><strong>{c.codeImmeuble}</strong></td>
                        <td><strong>{c.codeLocal}</strong></td>
                        <td>{c.quartier}</td>
                        <td>{c.nomPropriete}</td>
                        <td>{c.rg}</td>
                        <td>{c.localisation}</td>

                        {/* N° Compteur */}
                        <td>
                          <div className="compteurs-list">
                            {hasSousCompteurs ? (
                              c.sousCompteurs.map((sc, idx) => (
                                <div key={idx} className="compteur-line">
                                  {sc.numeroCompteur} ({sc.typeCompteur})
                                </div>
                              ))
                            ) : (
                              <span className="text-muted">Aucun numéro de compteur</span>
                            )}
                          </div>
                        </td>

                        {/* N° Facture */}
                        <td>
                          <div className="compteurs-list">
                            {hasSousCompteurs ? (
                              isTous ? (
                                <div style={{ textAlign: 'center' }}>{c.sousCompteurs[0]?.numeroFacture || "-"}</div>
                              ) : (
                                c.sousCompteurs.map((sc, idx) => (
                                  <div key={idx} className="compteur-line">{sc.numeroFacture || "-"}</div>
                                ))
                              )
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </div>
                        </td>

                        {/* Montant */}
                        <td>
                          <div className="compteurs-list">
                            {hasSousCompteurs ? (
                              isTous ? (
                                <div style={{ textAlign: 'center' }}>
                                  <strong className="text-success" style={{ color: "#0d9488" }}>{formatMontant(totalMontantTous)}</strong>
                                </div>
                              ) : (
                                c.sousCompteurs.map((sc, idx) => (
                                  <div key={idx} className="compteur-line">
                                    <strong className="text-success" style={{ color: "#0d9488" }}>{sc.montant != null ? formatMontant(sc.montant) : "-"}</strong>
                                  </div>
                                ))
                              )
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="action-buttons">
                            <OverlayTrigger placement="top" overlay={<Tooltip>Ajouter une facture</Tooltip>}>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleShowModal(c)}
                                style={{ background: "linear-gradient(135deg, #22c55e 0%, #0790bdff 100%)" }}
                                disabled={!hasSousCompteurs} // Désactiver si pas de sous-compteurs
                              >
                                <PlusCircleFill size={16} />
                              </Button>
                            </OverlayTrigger>
                            {hasSousCompteurs && c.sousCompteurs.some((sc) => sc.numeroFacture || sc.montant) && (
                              <OverlayTrigger placement="top" overlay={<Tooltip>Supprimer toutes les factures</Tooltip>}>
                                <Button variant="danger" size="sm" onClick={() => handleDeleteClick(c.sousCompteurs[0])}>
                                  <TrashFill size={16} />
                                </Button>
                              </OverlayTrigger>
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
          <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #22c55e 0%, #0790bdff 100%)" }}>
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
            <Button variant="primary" onClick={handleSubmit}
              style={{ background: "linear-gradient(135deg, #22c55e 0%, #0790bdff 100%)" }}>
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
          background: rgba(255, 255, 255, 0.1) !important; /* ← Plus transparent */
          backdrop-filter: blur(8px);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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
          max-height: 600px; /* Hauteur maximale pour le wrapper */
          display: flex;
          flex-direction: column;
        }

        .main-table {
          margin: 0;
          min-width: 1400px;
          text-align: center;
          border-collapse: collapse;
        }

        .main-table thead {
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
          box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.1);
        }

        .table-body-scroll {
          display: block;
          max-height: 500px; /* Hauteur de défilement pour le tbody */
          overflow-y: auto;
          overflow-x: hidden;
        }

        .main-table tbody tr {
          display: table;
          width: 100%;
          table-layout: fixed;
        }

        .main-table thead tr {
          display: table;
          width: 100%;
          table-layout: fixed;
        }

        th, td {
          background-color: white;
          padding: 8px;
          border: 1px solid #ddd;
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
          color: #0d9488;
          margin-bottom: 8px;
        }

        .paiement-date-selectors {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .date-selector-group {
          flex: 1;
          min-width: 120px;
        }

        .date-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 4px;
          display: block;
        }

        .date-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          background: white;
        }

        .date-select:focus {
          outline: none;
          border-color: #16a34a;
          box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.1);
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

          /* Ajustements pour le défilement sur mobile */
          .table-body-scroll {
            max-height: 400px;
          }

          .table-wrapper {
            max-height: 500px;
          }

          /* Modal personnalisé pour le paiement */
          .custom-payment-modal {
            max-width: 1400px !important;
            width: 95% !important;
          }

          .modal-xl.custom-payment-modal {
            max-width: 1400px !important;
          }

          .recap-table-container {
            margin-top: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }

          .recap-title {
            background: #f8f9fa;
            padding: 12px 16px;
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
          }

          .recap-table {
            width: 100%;
            font-size: 12px;
            border-collapse: collapse;
            min-width: 1200px; /* Augmenté pour plus de largeur */
          }

          .recap-table th {
            background: #f3f4f6;
            padding: 10px 12px;
            font-weight: 600;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
            white-space: nowrap;
          }

          .recap-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
            white-space: nowrap;
          }

          .recap-table tbody tr:hover {
            background: #f9fafb;
          }

          .recap-total {
            background: #ecfdf5;
            font-weight: 600;
          }

          .recap-total td {
            border-top: 2px solid #10b981;
            border-bottom: none;
            padding: 14px 12px;
          }

          /* Container responsive pour le tableau */
          .table-responsive {
            overflow-x: auto;
            max-height: 500px;
            overflow-y: auto;
          }

          /* Ajustements spécifiques pour le modal de paiement */
          .modal-body {
            padding: 20px;
          }

          @media (max-width: 1400px) {
            .custom-payment-modal {
              max-width: 95% !important;
              margin: 1.75rem auto;
            }
          }

          @media (max-width: 768px) {
            .custom-payment-modal {
              max-width: 98% !important;
              margin: 0.5rem auto;
            }
            
            .recap-table {
              font-size: 11px;
              min-width: 1000px;
            }
            
            .recap-table th,
            .recap-table td {
              padding: 6px 8px;
            }
          }
        }
      `}</style>
    </>
  )
}
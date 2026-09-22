"use client"

import { useEffect, useState } from "react"
import { getCompteurs, createCompteur, updateCompteur, deleteCompteur } from "../services/api"
import { Modal, Button, Form, Alert, OverlayTrigger, Tooltip } from "react-bootstrap"
import {
  PlusCircleFill,
  PencilSquare,
  TrashFill,
  Search,
  Grid3x3GapFill,
  XCircleFill,
  Filter,
  FileEarmarkPdfFill
} from "react-bootstrap-icons"
import ConfirmDialog from "../components/ConfirmDialog"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import ExcelJS from 'exceljs';

export default function AllCompteurs() {
  const [compteurs, setCompteurs] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingCompteur, setEditingCompteur] = useState(null)
  const [error, setError] = useState("")
  const [searchText, setSearchText] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [compteurToDelete, setCompteurToDelete] = useState(null)
  const { toasts, addToast, removeToast } = useToast()
  const [showFilters, setShowFilters] = useState(false)

  // États pour les filtres individuels
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
    loue: ""
  })

  const [form, setForm] = useState({
    codeImmeuble: "",
    codeLocal: "",
    nomPropriete: "",
    rg: "",
    typeBien: "",
    province: "",
    adresse: "",
    quartier: "",
    localisation: "",
    loue: false,
    sousCompteurs: [{ numeroCompteur: "", typeCompteur: "eau" }],
  });

  async function load() {
    setLoading(true)
    try {
      const data = await getCompteurs()
      setCompteurs(data)
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleShowModal = (compteur = null) => {
    setEditingCompteur(compteur);

    if (compteur) {
      // Mode modification
      setForm({
        codeImmeuble: compteur.codeImmeuble || "",
        codeLocal: compteur.codeLocal || "",
        nomPropriete: compteur.nomPropriete || "",
        rg: compteur.rg || "",
        typeBien: compteur.typeBien || "",
        province: compteur.province || "",
        adresse: compteur.adresse || "",
        quartier: compteur.quartier || "",
        localisation: compteur.localisation || "",
        loue: compteur.loue || false,
        sousCompteurs:
          compteur.sousCompteurs?.map((sc) => ({
            numeroCompteur: sc.numeroCompteur || "",
            typeCompteur: sc.typeCompteur || "eau",
          })) || [{ numeroCompteur: "", typeCompteur: "eau" }],
      });
    } else {
      // Mode ajout
      setForm({
        codeImmeuble: "",
        codeLocal: "",
        nomPropriete: "",
        rg: "",
        typeBien: "",
        province: "",
        adresse: "",
        quartier: "",
        localisation: "",
        loue: false,
        sousCompteurs: [{ numeroCompteur: "", typeCompteur: "eau" }],
      });
    }

    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleAddSousCompteur = () => {
    setForm({
      ...form,
      sousCompteurs: [
        ...form.sousCompteurs,
        { numeroCompteur: "", typeCompteur: "eau" },
      ],
    });
  };

  const handleChangeSousCompteur = (index, key, value) => {
    const scs = [...form.sousCompteurs];

    if (typeof scs[index] !== "object" || scs[index] === null) {
      scs[index] = { numeroCompteur: "", typeCompteur: "eau" };
    }

    scs[index][key] = value;
    setForm({ ...form, sousCompteurs: scs });
  };

  const handleRemoveSousCompteur = (index) => {
    const scs = form.sousCompteurs.filter((_, i) => i !== index);
    setForm({ ...form, sousCompteurs: scs });
  };

  const handleSubmit = async () => {
    // Vérification des champs principaux (sans les sous-compteurs)
    if (
      !form.nomPropriete ||
      !form.rg ||
      !form.typeBien ||
      !form.province ||
      !form.quartier ||
      !form.localisation
    ) {
      setError("Tous les champs principaux sont obligatoires.");
      return;
    }

    const hasIncompleteSousCompteurs = form.sousCompteurs.some(
      (sc) => (sc.numeroCompteur && !sc.typeCompteur) || (!sc.numeroCompteur && sc.typeCompteur)
    );

    if (hasIncompleteSousCompteurs) {
      setError("Si vous ajoutez un sous-compteur, le numéro et le type sont obligatoires.");
      return;
    }

    try {
      const payload = {
        ...form,
        sousCompteurs: form.sousCompteurs
          .filter(sc => sc.numeroCompteur && sc.typeCompteur)
          .map((sc) => ({
            numeroCompteur: sc.numeroCompteur,
            typeCompteur: sc.typeCompteur,
          })),
      };

      if (editingCompteur) {
        await updateCompteur(editingCompteur.id, payload);
        addToast("Compteur modifié avec succès", "success");
      } else {
        await createCompteur(payload);
        addToast("Compteur ajouté avec succès", "success");
      }

      load();
      handleCloseModal();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleDeleteClick = (c) => {
    setCompteurToDelete(c);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCompteur(compteurToDelete.id);
      addToast("Compteur supprimé avec succès", "success");
      load();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setShowDeleteConfirm(false);
      setCompteurToDelete(null);
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
      loue: ""
    })
  }

  // Filtrage combiné
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
        c.typeCompteur,
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
        (filters.loue === "" ||
          (filters.loue === "loue" && c.loue) ||
          (filters.loue === "libre" && !c.loue))

      return globalSearchMatch && individualFiltersMatch
    })
    .sort((a, b) => {
      return a.quartier.localeCompare(b.quartier, undefined, { sensitivity: 'base' })
    })

  const hasActiveFilters = Object.values(filters).some(filter => filter !== "")

  const downloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      // Titre
      doc.setFontSize(16)
      doc.text('LISTE DES COMPTEURS', 148.5, 15, { align: 'center' })
      doc.setFontSize(10)
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} - ${filteredCompteurs.length} compteurs`, 148.5, 22, { align: 'center' })

      // En-têtes du tableau avec largeurs ajustées
      const headers = ['Code Immeuble', 'Code Local', 'Province', 'Quartier', 'Propriété', 'RG', 'Type', 'Adresse', 'Localisation', 'Statut']
      const columnWidths = [30, 30, 25, 25, 35, 25, 30, 45, 25, 20]
      let yPosition = 35

      // Dessiner les en-têtes (sans couleur de fond, juste en gras)
      doc.setTextColor(0, 0, 0) // Noir
      doc.setFont(undefined, 'bold')
      doc.setFontSize(10)

      let xPosition = 3
      headers.forEach((header, index) => {
        // Dessiner uniquement la bordure, pas de fond coloré
        doc.rect(xPosition, yPosition - 9, columnWidths[index], 9, 'S')

        // Centrer le texte dans la cellule
        const textWidth = doc.getTextWidth(header)
        const textX = xPosition + (columnWidths[index] - textWidth) / 2
        doc.text(header, textX, yPosition - 2)
        xPosition += columnWidths[index]
      })

      // Données du tableau
      doc.setFont(undefined, 'normal')
      doc.setFontSize(8) // Taille de police plus petite

      filteredCompteurs.forEach((compteur, rowIndex) => {
        yPosition += 9

        // Vérifier si on besoin d'une nouvelle page
        if (yPosition > 190) { // A4 paysage hauteur = 210mm
          doc.addPage()
          yPosition = 35

          // Redessiner les en-têtes sur la nouvelle page
          doc.setTextColor(0, 0, 0)
          doc.setFont(undefined, 'bold')
          doc.setFontSize(10)

          xPosition = 11
          headers.forEach((header, index) => {
            doc.rect(xPosition, yPosition - 9, columnWidths[index], 9, 'S')
            const textWidth = doc.getTextWidth(header)
            const textX = xPosition + (columnWidths[index] - textWidth) / 2
            doc.text(header, textX, yPosition - 2)
            xPosition += columnWidths[index]
          })

          doc.setFont(undefined, 'normal')
          doc.setFontSize(9)
          yPosition += 9
        }

        xPosition = 3

        const rowData = [
          compteur.codeImmeuble || '-',
          compteur.codeLocal || '-',
          compteur.province || '-',
          compteur.quartier || '-',
          compteur.nomPropriete || '-',
          compteur.rg || '-',
          compteur.typeBien || '-',
          compteur.adresse || '-',
          compteur.localisation || '-',
          compteur.loue ? 'Occupé' : 'Libre'
        ]

        // Dessiner les bordures et le texte - TOUS CENTRÉS
        rowData.forEach((data, colIndex) => {
          // Tronquer le texte si trop long
          let displayText = data
          if (data.length > 20) {
            displayText = data.substring(0, 17) + '...'
          }

          doc.rect(xPosition, yPosition - 9, columnWidths[colIndex], 9, 'S')

          // TOUS LES TEXTES CENTRÉS
          const textWidth = doc.getTextWidth(displayText)
          const textX = xPosition + (columnWidths[colIndex] - textWidth) / 2
          doc.text(displayText, textX, yPosition - 2)

          xPosition += columnWidths[colIndex]
        })
      })

      doc.save(`compteurs_${new Date().toISOString().split('T')[0]}.pdf`)
      addToast("PDF téléchargé avec succès", "success")
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      addToast("Erreur lors de la génération du PDF", "error")
    }
  }

  const downloadExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Compteurs');

    // Définir les en-têtes
    worksheet.columns = [
      { header: 'Code Immeuble', key: 'codeImmeuble', width: 15 },
      { header: 'Code Local', key: 'codeLocal', width: 15 },
      { header: 'Province', key: 'province', width: 12 },
      { header: 'Quartier', key: 'quartier', width: 15 },
      { header: 'Propriété', key: 'nomPropriete', width: 15 },
      { header: 'RG', key: 'rg', width: 10 },
      { header: 'Type Bien', key: 'typeBien', width: 12 },
      { header: 'Adresse', key: 'adresse', width: 20 },
      { header: 'Localisation', key: 'localisation', width: 15 },
      { header: 'Statut', key: 'statut', width: 10 },
      { header: 'Compteurs', key: 'compteurs', width: 25 }
    ];

    // Ajouter les données
    const data = filteredCompteurs.map(c => ({
      codeImmeuble: c.codeImmeuble || '',
      codeLocal: c.codeLocal || '',
      province: c.province || '',
      quartier: c.quartier || '',
      nomPropriete: c.nomPropriete || '',
      rg: c.rg || '',
      typeBien: c.typeBien || '',
      adresse: c.adresse || '',
      localisation: c.localisation || '',
      statut: c.loue ? 'Occupé' : 'Libre',
      compteurs: c.sousCompteurs?.map(sc => `${sc.numeroCompteur} (${sc.typeCompteur})`).join(', ') || ''
    }));

    worksheet.addRows(data);

    // Style des en-têtes - EN GRAS
    worksheet.getRow(1).font = {
      bold: true,
      size: 12,
      color: { argb: '000000' }
    };

    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D3D3D3' }
    };

    worksheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center'
    };

    // Appliquer des bordures aux en-têtes
    worksheet.getRow(1).eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Télécharger le fichier
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compteurs_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);

    addToast("Fichier Excel téléchargé avec succès", "success");
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le compteur"
        message={`Êtes-vous sûr de vouloir supprimer le compteur "${compteurToDelete?.nomPropriete}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      <div className="page-container animate-fadeInUp">
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-icon">
              <Grid3x3GapFill size={28} />
            </div>
            <div>
              <h2 className="page-title">Tous les compteurs</h2>
              <p className="page-subtitle">Gérez l'ensemble de vos compteurs</p>
            </div>
          </div>
          <div className="header-actions">
            <Button variant="primary" onClick={() => handleShowModal()} className="btn-add">
              <PlusCircleFill size={20} />
              Ajouter un compteur
            </Button>
            <br /><br />
            <OverlayTrigger placement="top" overlay={<Tooltip>Télécharger en excel</Tooltip>}>
              <Button variant="outline-success" onClick={downloadExcel} className="me-2">
                <FileEarmarkPdfFill size={16} className="me-1" />
                Excel
              </Button>
            </OverlayTrigger>
            <OverlayTrigger placement="top" overlay={<Tooltip>Télécharger en pdf</Tooltip>}>
              <Button variant="outline-danger" onClick={downloadPDF}>
                <FileEarmarkPdfFill size={16} className="me-1" />
                PDF
              </Button>
            </OverlayTrigger>
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

              <div className="filter-group">
                <label className="filter-label">Statut</label>
                <select
                  value={filters.loue}
                  onChange={(e) => handleFilterChange('loue', e.target.value)}
                  className="filter-input"
                >
                  <option value="">Tous</option>
                  <option value="loue">Occupé</option>
                  <option value="libre">Libre</option>
                </select>
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
            <table className="table table-striped-custom">
              <thead>
                <tr>
                  <th>Code Immeuble</th>
                  <th>Code Local</th>
                  <th>Province</th>
                  <th>Quartier</th>
                  <th>Propriété</th>
                  <th>RG</th>
                  <th>Type Bien</th>
                  <th>Adresse</th>
                  <th>Localisation</th>
                  <th>Compteurs</th>
                  <th>Loué</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="scrollable-tbody">
                {filteredCompteurs.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-5">
                      <div className="empty-state">
                        <Grid3x3GapFill size={48} className="text-muted mb-3" />
                        <p className="text-muted">Aucun compteur trouvé</p>
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
                      <td>
                        <strong>{c.codeImmeuble}</strong>
                      </td>
                      <td>
                        <strong>{c.codeLocal}</strong>
                      </td>
                      <td>{c.province}</td>
                      <td>{c.quartier}</td>
                      <td>{c.nomPropriete}</td>
                      <td>{c.rg}</td>
                      <td>
                        <span className={`badge-type ${c.typeBien}`}>{c.typeBien}</span>
                      </td>
                      <td>{c.adresse}</td>
                      <td>{c.localisation}</td>
                      <td>
                        <div className="compteurs-list">
                          {c.sousCompteurs && c.sousCompteurs.length > 0 ? (
                            c.sousCompteurs.map((sc) => (
                              <div key={sc.id} className="d-flex align-items-center mb-1">
                                <span className="compteur-badge me-2">{sc.numeroCompteur}</span>
                                <span className={`badge-type ${sc.typeCompteur}`}>{sc.typeCompteur}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted">Aucun numéro de compteur</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge-status ${c.loue ? "loue" : "libre"}`}>
                          {c.loue ? "occupé" : "libre"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <OverlayTrigger placement="top" overlay={<Tooltip>Modifier</Tooltip>}>
                            <Button variant="warning" size="sm" onClick={() => handleShowModal(c)}>
                              <PencilSquare size={16} />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger placement="top" overlay={<Tooltip>Supprimer</Tooltip>}>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteClick(c)}>
                              <TrashFill size={16} />
                            </Button>
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

        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #22c55e 0%, #0790bdff 100%)" }}>
            <Modal.Title>{editingCompteur ? "Modifier le compteur" : "Ajouter un compteur"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Code Immeuble *</Form.Label>
                    <Form.Control
                      value={form.codeImmeuble}
                      onChange={(e) => setForm({ ...form, codeImmeuble: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Code Immeuble *</Form.Label>
                    <Form.Control
                      value={form.codeLocal}
                      onChange={(e) => setForm({ ...form, codeLocal: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Nom Propriété *</Form.Label>
                    <Form.Control
                      value={form.nomPropriete}
                      onChange={(e) => setForm({ ...form, nomPropriete: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>RG *</Form.Label>
                    <Form.Control value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })} />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Type du Bien *</Form.Label>
                    <Form.Select value={form.typeBien} onChange={(e) => setForm({ ...form, typeBien: e.target.value })}>
                      <option value="">-- Sélectionner --</option>
                      <option value="placement">Placement</option>
                      <option value="exploitation">Exploitation</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Province *</Form.Label>
                    <Form.Control
                      value={form.province}
                      onChange={(e) => setForm({ ...form, province: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Adresse *</Form.Label>
                    <Form.Control
                      value={form.adresse}
                      onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Quartier *</Form.Label>
                    <Form.Control
                      value={form.quartier}
                      onChange={(e) => setForm({ ...form, quartier: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Localisation *</Form.Label>
                    <Form.Control
                      value={form.localisation}
                      onChange={(e) => setForm({ ...form, localisation: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>

              <Form.Label>N° Compteur *</Form.Label>
              {form.sousCompteurs.map((sc, index) => (
                <div key={index} className="d-flex gap-2 mb-2">
                  <Form.Control
                    type="text"
                    placeholder="Numéro du compteur"
                    value={sc.numeroCompteur}
                    onChange={(e) => handleChangeSousCompteur(index, "numeroCompteur", e.target.value)}
                  />
                  <Form.Select
                    value={sc.typeCompteur}
                    onChange={(e) => handleChangeSousCompteur(index, "typeCompteur", e.target.value)}
                  >
                    <option value="eau">Eau</option>
                    <option value="électricité">Électricité</option>
                  </Form.Select>
                  <Button
                    variant="danger"
                    onClick={() => handleRemoveSousCompteur(index)}
                  >
                    <XCircleFill />
                  </Button>
                </div>
              ))}
              <Button variant="secondary" onClick={handleAddSousCompteur}>
                Ajouter un sous-compteur
              </Button>
              <br /> <br />
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Loué ?"
                  checked={form.loue}
                  onChange={(e) => setForm({ ...form, loue: e.target.checked })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSubmit}
              style={{ background: "linear-gradient(135deg, #22c55e 0%, #0790bdff 100%)" }}
            >
              {editingCompteur ? "Modifier" : "Ajouter"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  )
}
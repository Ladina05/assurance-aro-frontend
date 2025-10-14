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
} from "react-bootstrap-icons"
import ConfirmDialog from "../components/ConfirmDialog"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import "../styles/animations.css"

export default function NonLoues() {
  const [compteurs, setCompteurs] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [currentSousCompteur, setCurrentSousCompteur] = useState(null)
  const [form, setForm] = useState({ numeroFacture: "", montant: "" })
  const [searchText, setSearchText] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPayConfirm, setShowPayConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const { toasts, addToast, removeToast } = useToast()

  const formatMontant = (valeur) => {
    if (typeof valeur !== "number") return "-"
    return (
      valeur.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
  }

  async function load() {
    setLoading(true)
    try {
      const data = await getCompteurs(false) // non loués
      const flatList = data.flatMap((c) =>
        c.sousCompteurs.map((s) => ({
          compteurId: c.id,
          codeImmeuble: c.codeImmeuble,
          nomPropriete: c.nomPropriete,
          rg: c.rg,
          typeBien: c.typeBien,
          province: c.province,
          adresse: c.adresse,
          quartier: c.quartier,
          localisation: c.localisation,
          typeCompteur: c.typeCompteur,
          ...s,
        })),
      )
      setCompteurs(flatList)
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleShowModal = (sousCompteur) => {
    setCurrentSousCompteur(sousCompteur)
    setForm({
      numeroFacture: sousCompteur.numeroFacture || "",
      montant: sousCompteur.montant || "",
    })
    setShowModal(true)
  }

  const handleCloseModal = () => setShowModal(false)

  const handleSubmit = async () => {
    if (!form.numeroFacture && !form.montant) {
      addToast("Veuillez remplir au moins N° Facture ou Montant", "warning")
      return
    }
    try {
      await updateSousCompteur(currentSousCompteur.id, {
        numeroFacture: form.numeroFacture || null,
        montant: form.montant ? Number(form.montant) : null,
      })
      addToast("Facture ajoutée avec succès", "success")
      load()
      handleCloseModal()
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const totalMontant = compteurs.reduce((acc, s) => acc + (s.montant || 0), 0)

  const handlePayBatch = async () => {
    const payables = compteurs.filter((s) => typeof s.montant === "number" && s.montant > 0)
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
      await updateSousCompteur(itemToDelete.id, {
        numeroFacture: null,
        montant: null,
      })
      addToast("Facture supprimée avec succès", "success")
      load()
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setShowDeleteConfirm(false)
      setItemToDelete(null)
    }
  }

  // Filtrage
  const filteredCompteurs = compteurs
    .filter((c) => {
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
      return mainMatch || sousMatch
    })
    .sort((a, b) => {
      // Tri alphabétique du quartier, insensible à la casse
      return a.quartier.localeCompare(b.quartier, undefined, { sensitivity: 'base' })
    })

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
                  <th>Type Compteur</th>
                  <th>N° Compteur</th>
                  <th>N° Facture</th>
                  <th>Montant (Ar)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompteurs.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="text-center py-5">
                      <div className="empty-state">
                        <HouseSlashFill size={48} className="text-muted mb-3" />
                        <p className="text-muted">Aucun compteur libre trouvé</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCompteurs.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.codeImmeuble}</strong>
                      </td>
                      <td>{s.province}</td>
                      <td>{s.quartier}</td>
                      <td>{s.nomPropriete}</td>
                      <td>{s.rg}</td>
                      <td>
                        <span className={`badge-type ${s.typeBien}`}>{s.typeBien}</span>
                      </td> 
                      <td>{s.adresse}</td>
                      <td>{s.localisation}</td>
                      <td>
                        <span className={`badge-type ${s.typeCompteur}`}>{s.typeCompteur}</span>
                      </td>
                      <td>
                        <span className="compteur-badge">{s.numeroCompteur}</span>
                      </td>
                      <td>{s.numeroFacture || "-"}</td>
                      <td>
                        <strong className="text-success">{formatMontant(s.montant)}</strong>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button variant="primary" size="sm" onClick={() => handleShowModal(s)}>
                            {s.numeroFacture || s.montant ? <PencilSquare size={16} /> : <PlusCircleFill size={16} />}
                          </Button>
                          {(s.numeroFacture || s.montant) && (
                            <Button variant="danger" size="sm" onClick={() => handleDeleteClick(s)}>
                              <TrashFill size={16} />
                            </Button>
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

        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Ajouter N° Facture / Montant</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
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
          margin-bottom: 24px;
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
        }
      `}</style>
    </>
  )
}
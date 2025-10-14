"use client"

import { useEffect, useState } from "react"
import { getCompteurs, createCompteur, updateCompteur, deleteCompteur } from "../services/api"
import { Modal, Button, Form, Alert } from "react-bootstrap"
import { PlusCircleFill, PencilSquare, TrashFill, Search, Grid3x3GapFill, XCircleFill } from "react-bootstrap-icons"
import ConfirmDialog from "../components/ConfirmDialog"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import "../styles/animations.css"

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

  const [form, setForm] = useState({
    codeImmeuble: "",
    nomPropriete: "",
    rg: "",
    typeBien: "",
    province: "",
    adresse: "",
    quartier: "",
    localisation: "",
    typeCompteur: "",
    loue: false,
    sousCompteurs: [""],
  })

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
    setEditingCompteur(compteur)
    setForm({
      codeImmeuble: compteur?.codeImmeuble || "",
      nomPropriete: compteur?.nomPropriete || "",
      rg: compteur?.rg || "",
      typeBien: compteur?.typeBien || "",
      province: compteur?.province || "",
      adresse: compteur?.adresse || "",
      quartier: compteur?.quartier || "",
      localisation: compteur?.localisation || "",
      typeCompteur: compteur?.typeCompteur || "",
      loue: compteur?.loue || false,
      sousCompteurs: compteur?.sousCompteurs?.map((sc) => sc.numeroCompteur) || [""],
    })
    setError("")
    setShowModal(true)
  }

  const handleCloseModal = () => setShowModal(false)
  const handleAddSousCompteur = () => setForm({ ...form, sousCompteurs: [...form.sousCompteurs, ""] })
  const handleChangeSousCompteur = (index, value) => {
    const scs = [...form.sousCompteurs]
    scs[index] = value
    setForm({ ...form, sousCompteurs: scs })
  }
  const handleRemoveSousCompteur = (index) => {
    const scs = form.sousCompteurs.filter((_, i) => i !== index)
    setForm({ ...form, sousCompteurs: scs })
  }

  const handleSubmit = async () => {
    if (
      !form.codeImmeuble ||
      !form.nomPropriete ||
      !form.rg ||
      !form.typeBien ||
      !form.province ||
      !form.adresse ||
      !form.quartier ||
      !form.localisation ||
      !form.typeCompteur ||
      form.sousCompteurs.some((sc) => !sc)
    ) {
      setError("Tous les champs et tous les numéros de compteur sont obligatoires.")
      return
    }

    try {
      const payload = {
        ...form,
        sousCompteurs: form.sousCompteurs.map((numeroCompteur) => ({ numeroCompteur })),
      }

      if (editingCompteur) {
        await updateCompteur(editingCompteur.id, payload)
        addToast("Compteur modifié avec succès", "success")
      } else {
        await createCompteur(payload)
        addToast("Compteur ajouté avec succès", "success")
      }
      load()
      handleCloseModal()
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  const handleDeleteClick = (c) => {
    setCompteurToDelete(c)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteCompteur(compteurToDelete.id)
      addToast("Compteur supprimé avec succès", "success")
      load()
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setShowDeleteConfirm(false)
      setCompteurToDelete(null)
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
        c.typeCompteur,
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
          <Button variant="primary" onClick={() => handleShowModal()} className="btn-add">
            <PlusCircleFill size={20} />
            Ajouter un compteur
          </Button>
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
                  <th>Sous-Compteurs</th>
                  <th>Loué</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompteurs.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="text-center py-5">
                      <div className="empty-state">
                        <Grid3x3GapFill size={48} className="text-muted mb-3" />
                        <p className="text-muted">Aucun compteur trouvé</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCompteurs.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.codeImmeuble}</strong>
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
                        <span className={`badge-type ${c.typeCompteur}`}>{c.typeCompteur}</span>
                      </td>
                      <td>
                        <div className="compteurs-list">
                          {c.sousCompteurs?.map((sc) => (
                            <span key={sc.id} className="compteur-badge">
                              {sc.numeroCompteur}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge-status ${c.loue ? "loue" : "libre"}`}>{c.loue ? "occupé" : "libre"}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button variant="warning" size="sm" onClick={() => handleShowModal(c)}>
                            <PencilSquare size={16} />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteClick(c)}>
                            <TrashFill size={16} />
                          </Button>
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
          <Modal.Header closeButton>
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
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Type du Compteur *</Form.Label>
                    <Form.Select value={form.typeCompteur} onChange={(e) => setForm({ ...form, typeCompteur: e.target.value })}>
                      <option value="">-- Sélectionner --</option>
                      <option value="eau">eau</option>
                      <option value="électricité">électricité</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <Form.Label>N° Compteur *</Form.Label>
              {form.sousCompteurs.map((sc, i) => (
                <div key={i} className="d-flex mb-2 gap-2">
                  <Form.Control
                    value={sc}
                    onChange={(e) => handleChangeSousCompteur(i, e.target.value)}
                    placeholder={`Compteur ${i + 1}`}
                  />
                  {form.sousCompteurs.length > 1 && (
                    <Button variant="danger" size="sm" onClick={() => handleRemoveSousCompteur(i)}>
                      <TrashFill size={16} />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline-secondary" size="sm" onClick={handleAddSousCompteur} className="mt-2">
                <PlusCircleFill size={16} className="me-1" />
                Ajouter un N° Compteur
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
            <Button variant="primary" onClick={handleSubmit}>
              {editingCompteur ? "Modifier" : "Ajouter"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      <style jsx>{`
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
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

        .btn-add {
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
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
          min-width: 1200px;
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

        .compteurs-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .compteur-badge {
          background: #dcfce7;
          color: #166534;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-status {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-status.loue {
          background: #dcfce7;
          color: #166534;
        }

        .badge-status.libre {
          background: #fef3c7;
          color: #92400e;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
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

          .btn-add {
            width: 100%;
          }

          .table-wrapper {
            border-radius: 8px;
          }
        }
      `}</style>
    </>
  )
}
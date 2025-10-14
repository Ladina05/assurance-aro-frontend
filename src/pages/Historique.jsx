"use client"

import { useEffect, useState } from "react"
import { getBatches } from "../services/api"
import { Link } from "react-router-dom"
import { ClockHistory, EyeFill, TrashFill, FileEarmarkPdfFill } from "react-bootstrap-icons"
import ConfirmDialog from "../components/ConfirmDialog"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import "../styles/animations.css"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api"

async function downloadBatchPdf(batchId) {
  const res = await fetch(`${API_BASE}/payment-batches/${batchId}/pdf`)
  if (!res.ok) throw new Error("Erreur génération PDF")
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `paiement_batch_${batchId}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

const formatMontantFR = (montant) => {
  if (montant == null) return "-"
  return (
    montant.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " Ar"
  )
}

export default function Historique() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState(null)
  const { toasts, addToast, removeToast } = useToast()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getBatches()
        setBatches(data)
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
      const res = await fetch(`${API_BASE}/payment-batches/${batchToDelete.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Erreur suppression")
      setBatches((prev) => prev.filter((batch) => batch.id !== batchToDelete.id))
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
      await downloadBatchPdf(batchId)
      addToast("PDF téléchargé avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

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

      <div className="page-container fadeInUp">
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-icon" style={{ background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)" }}>
              <ClockHistory size={28} />
            </div>
            <div>
              <h2 className="page-title">Historique des paiements</h2>
              <p className="page-subtitle">Consultez l'historique de tous vos paiements mensuels</p>
            </div>
          </div>
          <div className="stats-badge" style={{ background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)" }}>
            <span className="stats-number">{batches.length}</span>
            <span className="stats-label">Paiements</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner-border text-success" />
            <p>Chargement de l'historique...</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-5">
                      <div className="empty-state">
                        <ClockHistory size={48} className="text-muted mb-3" />
                        <p className="text-muted">Aucun historique de paiement</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id}>
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
                        <strong className="text-success">{formatMontantFR(b.total)}</strong>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/historique/${b.id}`} className="btn btn-primary btn-sm">
                            <EyeFill size={16} />
                          </Link>
                          <button className="btn btn-success btn-sm" onClick={() => handleDownloadPdf(b.id)}>
                            <FileEarmarkPdfFill size={16} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(b)}>
                            <TrashFill size={16} />
                          </button>
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
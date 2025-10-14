"use client"

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getBatchDetails } from "../services/api"
import { ArrowLeft, FileEarmarkPdfFill, CalendarEvent, CashStack } from "react-bootstrap-icons"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import "../styles/animations.css"

export default function BatchDetails() {
  const { id } = useParams()
  const [batch, setBatch] = useState(null)
  const [loading, setLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api"

  const formatMontantFR = (montant) => {
    if (montant == null) return "-"
    return (
      montant.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
  }

  async function downloadBatchPdf() {
    try {
      const res = await fetch(`${API_BASE}/payment-batches/${id}/pdf`)
      if (!res.ok) throw new Error("Erreur lors de la génération du PDF")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `paiement_batch_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      addToast("PDF téléchargé avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getBatchDetails(id)
        setBatch(data)
      } catch (err) {
        addToast(err.message, "error")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner-border text-success" />
        <p>Chargement des détails...</p>
      </div>
    )
  }

  if (!batch) return null

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="page-container fadeInUp">
        <div className="details-header">
          <Link to="/historique" className="btn btn-outline-secondary mb-3">
            <ArrowLeft size={18} />
            Retour à l'historique
          </Link>

          <div className="details-title-section">
            <h2 className="details-title">Détails du paiement #{batch.id}</h2>
            <button onClick={downloadBatchPdf} className="btn btn-success">
              <FileEarmarkPdfFill size={18} />
              Télécharger le reçu PDF
            </button>
          </div>

          <div className="info-cards">
            <div className="info-card">
              <div
                className="info-card-icon"
                style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
              >
                <CalendarEvent size={24} />
              </div>
              <div className="info-card-content">
                <div className="info-card-label">Date du paiement</div>
                <div className="info-card-value">
                  {new Date(batch.date).toLocaleString("fr-FR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </div>
              </div>
            </div>

            <div className="info-card">
              <div
                className="info-card-icon"
                style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}
              >
                <CashStack size={24} />
              </div>
              <div className="info-card-content">
                <div className="info-card-label">Montant total</div>
                <div className="info-card-value text-success">{formatMontantFR(batch.total)} Ar</div>
              </div>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3 className="section-title">Liste des paiements ({batch.payments.length})</h3>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Code Immeuble</th>
                  <th>Province</th>
                  <th>Quartier</th>
                  <th>Propriété</th>
                  <th>RG</th> 
                  <th>Adresse</th>
                  <th>Localisation</th>
                  <th>Type Compteur</th>
                  <th>N°Compteur</th>
                  <th>N° Facture</th>
                  <th>Montant (Ar)</th>
                </tr>
              </thead>
              <tbody>
                {batch.payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.compteur?.codeImmeuble ?? "-"}</strong>
                    </td>
                    <td>{p.compteur?.province ?? "-"}</td>
                    <td>{p.compteur?.quartier ?? "-"}</td>
                    <td>{p.compteur?.nomPropriete ?? "-"}</td>
                    <td>{p.compteur?.rg ?? "-"}</td>
                    <td>{p.compteur?.adresse ?? "-"}</td>
                    <td>{p.compteur?.localisation ?? "-"}</td>
                    <td>
                      <span className={`badge-type ${p.compteur?.typeCompteur}`}>{p.compteur?.typeCompteur ?? "-"}</span>
                    </td>
                    <td>
                      <span className="compteur-badge">{p.numeroCompteur ?? "-"}</span>
                    </td>
                    <td>{p.numeroFacture ?? "-"}</td>
                    <td>
                      <strong className="text-success">{formatMontantFR(p.montant)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .details-header {
          margin-bottom: 32px;
        }

        .details-title-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .details-title {
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
        }

        .info-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .info-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 2px solid #f3f4f6;
          transition: all 0.2s;
        }

        .info-card:hover {
          border-color: #dcfce7;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .info-card-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .info-card-content {
          flex: 1;
        }

        .info-card-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #9ca3af;
          margin-bottom: 4px;
        }

        .info-card-value {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .details-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f3f4f6;
        }

        @media (max-width: 768px) {
          .details-title-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .details-title-section .btn {
            width: 100%;
          }

          .info-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}
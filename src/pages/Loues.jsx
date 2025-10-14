"use client"

import { useEffect, useState } from "react"
import { getCompteurs } from "../services/api"
import { HouseFill, Search, XCircleFill } from "react-bootstrap-icons"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import "../styles/animations.css"

export default function Loues() {
  const [compteurs, setCompteurs] = useState([])
  const [searchText, setSearchText] = useState("")
  const [loading, setLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getCompteurs(true) // loués
        setCompteurs(data)
      } catch (err) {
        addToast(err.message, "error")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filtrage par recherche
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
      <div className="page-container animate-fadeInUp">
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-icon" style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" }}>
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
                  <th>N° Compteurs</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompteurs.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5">
                      <div className="empty-state">
                        <HouseFill size={48} className="text-muted mb-3" />
                        <p className="text-muted">Aucun compteur loué trouvé</p>
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
                          {c.sousCompteurs && c.sousCompteurs.length > 0
                            ? c.sousCompteurs.map((s) => (
                                <span key={s.id} className="compteur-badge">
                                  {s.numeroCompteur}
                                </span>
                              ))
                            : "-"}
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
          min-width: 1000px;
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

        .stats-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
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
        }
      `}</style>
    </>
  )
}
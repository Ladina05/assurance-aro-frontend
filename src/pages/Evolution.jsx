"use client"

import { useState } from "react"
import { getStatistiquesEvolution, exportEvolutionExcel, exportEvolutionPdf } from "../services/api"
import { BarChart, Filter, Search, Calendar, CurrencyDollar, FileEarmarkExcel, FileEarmarkPdf } from "react-bootstrap-icons"
import { Button } from "react-bootstrap"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
export default function Evolution() {
  const [rg, setRg] = useState("")
  const [annee, setAnnee] = useState(new Date().getFullYear().toString())
  const [statistiques, setStatistiques] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState({ excel: false, pdf: false })
  const { toasts, addToast, removeToast } = useToast()

  const nomsMois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const handleFiltrer = async () => {
    if (!rg.trim() || !annee.trim()) {
      addToast("Veuillez remplir le RG du compteur et l'année", "warning")
      return
    }

    setLoading(true)
    try {
      const data = await getStatistiquesEvolution(rg.trim(), annee.trim())
      setStatistiques(data)
      addToast(`Statistiques chargées pour le compteur RG ${rg} - ${annee}`, "success")
    } catch (err) {
      addToast(err.message, "error")
      setStatistiques(null)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    if (!statistiques) return

    setExportLoading(prev => ({ ...prev, excel: true }))
    try {
      const blob = await exportEvolutionExcel(rg, annee)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `evolution_paiements_${statistiques.compteur.rg}_${annee}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      addToast("Fichier Excel téléchargé avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setExportLoading(prev => ({ ...prev, excel: false }))
    }
  }

  const handleExportPdf = async () => {
    if (!statistiques) return

    setExportLoading(prev => ({ ...prev, pdf: true }))
    try {
      const blob = await exportEvolutionPdf(rg, annee)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `evolution_paiements_${statistiques.compteur.rg}_${annee}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      addToast("Fichier PDF téléchargé avec succès", "success")
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setExportLoading(prev => ({ ...prev, pdf: false }))
    }
  }

  const formatMontantFR = (montant) => {
    if (montant == null) return "-"
    return (
      montant
        .toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        .replace(/\u202F/g, " ") + " Ar"
    )
  }

  // Préparer les données pour le graphique
  const chartData = statistiques ? {
    labels: statistiques.statistiques.map(s => s.nomMois),
    datasets: [
      {
        label: `Montant des paiements (${statistiques.annee})`,
        data: statistiques.statistiques.map(s => s.montant),
        backgroundColor: 'rgba(13, 148, 136, 0.8)',
        borderColor: 'rgba(13, 148, 136, 1)',
        borderWidth: 2,
        borderRadius: 6,
      }
    ]
  } : null

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Évolution des paiements - ${statistiques?.annee || ''}`
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Montant (Ar)'
        },
        ticks: {
          callback: function (value) {
            return formatMontantFR(value)
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Mois'
        }
      }
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="page-container">
        <div className="page-header animate-fade-in-down">
          <div className="page-header-content animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="page-icon" style={{ background: "linear-gradient(135deg, #0ee2f5ff 0%, #7c3aed 100%)" }}>
              <BarChart size={28} />
            </div>
            <div>
              <h2 className="page-title">Évolution des paiements</h2>
              <p className="page-subtitle">Suivez l'évolution des paiements de factures par compteur et par année</p>
            </div>
          </div>
        </div>

        {/* Formulaire de filtrage */}
        <div className="evolution-form animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <Search size={16} />
                RG du compteur
              </label>
              <input
                type="text"
                placeholder="Entrez le RG du compteur..."
                value={rg}
                onChange={(e) => setRg(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} />
                Année
              </label>
              <input
                type="number"
                placeholder="Ex: 2024"
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ opacity: 0 }}>Action</label>
              <Button
                onClick={handleFiltrer}
                disabled={loading}
                className="filter-btn"
                style={{ background: "linear-gradient(135deg, #0ee2f5ff 0%, #7c3aed 100%)" }}
              >
                <Filter size={18} />
                {loading ? "Chargement..." : "Filtrer"}
              </Button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-state animate-fade-in">
            <div className="spinner-border text-primary" />
            <p>Calcul des statistiques en cours...</p>
          </div>
        )}

        {statistiques && !loading && (
          <div className="results-container animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            {/* En-tête des résultats */}
            <div className="results-header">
              <div className="compteur-info">
                <h3>Compteur RG: {statistiques.compteur.rg}</h3>
                <p>
                  {statistiques.compteur.nomPropriete && `${statistiques.compteur.nomPropriete} - `}
                  {statistiques.compteur.quartier} • {statistiques.compteur.localisation}
                </p>
              </div>
              <div className="total-annuel">
                <div className="total-icon">
                  <CurrencyDollar size={24} />
                </div>
                <div>
                  <div className="total-label">Total annuel {statistiques.annee}</div>
                  <div className="total-value">{formatMontantFR(statistiques.totalAnnuel)}</div>
                </div>
              </div>
            </div>

            {/* Tableau des statistiques avec boutons d'export */}
            <div className="table-section">
              <div className="table-header">
                <h4 className="section-title">Détails par mois</h4>
                <div className="export-buttons">
                  <Button
                    onClick={handleExportExcel}
                    disabled={exportLoading.excel}
                    className="export-btn excel-btn"
                    size="sm"
                  >
                    <FileEarmarkExcel size={16} />
                    {exportLoading.excel ? "..." : "Excel"}
                  </Button>
                  <Button
                    onClick={handleExportPdf}
                    disabled={exportLoading.pdf}
                    className="export-btn pdf-btn"
                    size="sm"
                  >
                    <FileEarmarkPdf size={16} />
                    {exportLoading.pdf ? "..." : "PDF"}
                  </Button>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mois</th>
                      <th>Montant payé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistiques.statistiques.map((stat, index) => (
                      <tr key={stat.mois} className="animate-fade-in-up" style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
                        <td>
                          <strong>{stat.nomMois}</strong>
                        </td>
                        <td>
                          <span className={`montant ${stat.montant > 0 ? 'text-success' : 'text-muted'}`}>
                            {formatMontantFR(stat.montant)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Graphique histogramme */}
            <div className="chart-section">
              <h4 className="section-title">Histogramme des paiements</h4>
              <div className="chart-container">
                {chartData ? (
                  <div className="chart-wrapper">
                    {/* Nous utiliserons Chart.js - vous devrez l'installer */}
                    {/* <Bar data={chartData} options={chartOptions} /> */}

                    {/* Solution temporaire avec des barres CSS */}
                    <div className="css-bars-chart">
                      {statistiques.statistiques.map((stat, index) => {
                        const maxMontant = Math.max(...statistiques.statistiques.map(s => s.montant))
                        const hauteurPourcentage = maxMontant > 0 ? (stat.montant / maxMontant) * 100 : 0

                        return (
                          <div key={stat.mois} className="bar-container">
                            <div className="bar-label">{stat.nomMois}</div>
                            <div className="bar-wrapper">
                              <div
                                className="bar"
                                style={{
                                  height: `${hauteurPourcentage}%`,
                                  background: stat.montant > 0 ?
                                    "linear-gradient(135deg, #0ee2f5ff 0%, #7c3aed 100%)" :
                                    "#e5e7eb"
                                }}
                                title={`${stat.nomMois}: ${formatMontantFR(stat.montant)}`}
                              >
                                {stat.montant > 0 && (
                                  <span className="bar-value">
                                    {formatMontantFR(stat.montant)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="no-chart-data">
                    <BarChart size={48} className="text-muted mb-3" />
                    <p className="text-muted">Aucune donnée disponible pour le graphique</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!statistiques && !loading && (
          <div className="empty-state animate-fade-in">
            <BarChart size={64} className="text-muted mb-4" />
            <h3 className="empty-title">Aucune statistique affichée</h3>
            <p className="empty-subtitle">
              Veuillez saisir le RG d'un compteur et une année, puis cliquer sur "Filtrer" pour voir l'évolution des paiements.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
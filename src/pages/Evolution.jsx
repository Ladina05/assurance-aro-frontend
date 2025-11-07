"use client"

import { useState } from "react"
import { getStatistiquesEvolution, exportEvolutionExcel, exportEvolutionPdf } from "../services/api"
import { BarChart, Filter, Search, Calendar, CurrencyDollar, FileEarmarkExcel, FileEarmarkPdf } from "react-bootstrap-icons"
import { Button } from "react-bootstrap"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import "../styles/animations.css"

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
                        <div className="page-icon" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" }}>
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
                                style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" }}
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
                                                                        "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" :
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

            <style>{`
        .page-container {
          padding: 32px 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
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
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
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

        .evolution-form {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 20px;
          align-items: end;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-input {
          padding: 14px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .filter-btn {
          padding: 14px 28px;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          color: white;
        }

        .filter-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
        }

        .filter-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

        .results-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e5e7eb;
        }

        .compteur-info h3 {
          margin: 0 0 8px 0;
          color: #1a1a1a;
          font-size: 20px;
        }

        .compteur-info p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .total-annuel {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .total-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .total-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .total-value {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
        }

        .table-section, .chart-section {
          padding: 32px;
        }

        .table-section {
          border-bottom: 1px solid #e5e7eb;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 20px;
        }

        .table-wrapper {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .table {
          width: 100%;
          margin: 0;
        }

        .table th {
          background: #f8fafc;
          padding: 16px;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }

        .table td {
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .montant {
          font-weight: 600;
          font-size: 15px;
        }

        .chart-container {
          background: white;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #e5e7eb;
        }

        .css-bars-chart {
          display: flex;
          align-items: end;
          justify-content: space-between;
          height: 300px;
          gap: 12px;
          padding: 20px 0;
        }

        .bar-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          height: 100%;
        }

        .bar-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 8px;
          text-align: center;
        }

        .bar-wrapper {
          flex: 1;
          display: flex;
          align-items: end;
          width: 100%;
          max-width: 60px;
        }

        .bar {
          width: 100%;
          border-radius: 6px 6px 0 0;
          transition: all 0.3s ease;
          position: relative;
          min-height: 4px;
        }

        .bar:hover {
          opacity: 0.8;
          transform: scale(1.05);
        }

        .bar-value {
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          background: white;
          padding: 2px 6px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          white-space: nowrap;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
        }

        .empty-title {
          font-size: 20px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .empty-subtitle {
          color: #9ca3af;
          font-size: 15px;
          max-width: 400px;
          margin: 0 auto;
        }

        .no-chart-data {
          text-align: center;
          padding: 60px 20px;
          color: #9ca3af;
        }

        /* Animations */
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        /* Styles pour les boutons d'export */
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .export-buttons {
          display: flex;
          gap: 12px;
        }

        .export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .export-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .excel-btn {
          background: linear-gradient(135deg, #21a366 0%, #13804c 100%);
          color: white;
        }

        .excel-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #13804c 0%, #0d6b3d 100%);
        }

        .pdf-btn {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
        }

        .pdf-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
        }

        /* Responsive pour les boutons d'export */
        @media (max-width: 768px) {
          .table-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .export-buttons {
            width: 100%;
            justify-content: flex-start;
          }

          .export-btn {
            flex: 1;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .export-buttons {
                flex-direction: column;
          }

          .export-btn {
            width: 100%;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .page-container {
            padding: 24px 16px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .evolution-form {
            padding: 24px;
          }

          .results-header {
            flex-direction: column;
            gap: 20px;
            align-items: flex-start;
          }

          .total-annuel {
            width: 100%;
          }

          .table-section, .chart-section {
            padding: 24px;
          }

          .css-bars-chart {
            height: 200px;
            gap: 8px;
          }

          .bar-wrapper {
            max-width: 40px;
          }

          .bar-value {
            font-size: 9px;
            top: -20px;
          }
        }
      `}</style>
        </>
    )
}
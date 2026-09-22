import { Link } from "react-router-dom"
import { Grid3x3GapFill, HouseFill, HouseSlashFill, ClockHistory, BarChart, CurrencyDollar, Calendar, Filter } from "react-bootstrap-icons"
import { useState, useEffect } from "react"
import { getStatistiquesGeneral } from "../services/api"
import { useToast } from "../hooks/useToast"
import ToastContainer from "../components/ToastContainer"
import { Button } from "react-bootstrap"
export default function Home() {
  const [statistiques, setStatistiques] = useState(null)
  const [loading, setLoading] = useState(true)
  const [annee, setAnnee] = useState(new Date().getFullYear().toString())
  const { toasts, addToast, removeToast } = useToast()

  const menuItems = [
    {
      title: "Tous les compteurs",
      description: "Gérer tous vos compteurs",
      icon: <Grid3x3GapFill size={25} />,
      link: "/all-compteurs",
      color: "emerald",
      gradient: "linear-gradient(135deg, #22c5adff 0%, #09b49dff 100%)",
    },
    {
      title: "Compteurs loués",
      description: "Voir les compteurs loués",
      icon: <HouseFill size={25} />,
      link: "/loues",
      color: "green",
      gradient: "linear-gradient(135deg, #59edd9ff 0%, #089683ff 100%)",
    },
    {
      title: "Compteurs libres",
      description: "Gérer les compteurs non loués",
      icon: <HouseSlashFill size={25} />,
      link: "/non-loues",
      color: "lime",
      gradient: "linear-gradient(135deg, #0af392ff 0%, #04887fff 100%)",
    },
    {
      title: "Évolution par compteur",
      description: "Analyser l'évolution des paiements par compteur",
      icon: <BarChart size={25} />,
      link: "/evolution",
      color: "purple",
      gradient: "linear-gradient(135deg, #0ee2f5ff 0%, #7c3aed 100%)",
    },
    {
      title: "Historique",
      description: "Consulter l'historique des paiements",
      icon: <ClockHistory size={25} />,
      link: "/historique",
      color: "teal",
      gradient: "linear-gradient(135deg, #14b8a6 0%, #034e47ff 100%)",
    },
  ]

  useEffect(() => {
    loadStatistiques()
  }, [annee])

  const loadStatistiques = async () => {
    setLoading(true)
    try {
      const data = await getStatistiquesGeneral(annee)
      setStatistiques(data)
    } catch (err) {
      addToast("Erreur lors du chargement des statistiques", "error")
      setStatistiques(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrer = (e) => {
    e.preventDefault()
    loadStatistiques()
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

  // Trouver le mois avec le montant maximum pour l'échelle du graphique
  const getMaxMontant = () => {
    if (!statistiques) return 0
    return Math.max(...statistiques.statistiques.map(s => s.montant))
  }

  const maxMontant = getMaxMontant()

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="home-container">
        <div className="home-hero">
          <h1 className="home-title">Bienvenue sur ARO IMMO</h1>
          <p className="home-subtitle">Gérez efficacement vos compteurs et suivez vos paiements en toute simplicité</p>
        </div>

        {/* Menu de navigation - COMPACT ET HORIZONTAL */}
        <div className="nav-menu-container">
          <div className="nav-menu">
            {menuItems.map((item, index) => (
              <Link key={index} to={item.link} className="nav-item" style={{ "--item-gradient": item.gradient }}>
                <div className="nav-icon" style={{ background: item.gradient }}>
                  {item.icon}
                </div>
                <div className="nav-content">
                  <h3 className="nav-title">{item.title}</h3>
                  <p className="nav-description">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Section Statistiques Générales - DÉPLACÉ EN BAS */}
        <div className="stats-section">
          <div className="stats-header">
            <div className="stats-title-section">
              <h2 className="stats-title">
                <BarChart size={24} />
                Évolution générale des paiements
              </h2>
              <p className="stats-subtitle">Visualisez l'évolution mensuelle de tous vos paiements</p>
            </div>

            {/* Formulaire de filtre par année */}
            <form onSubmit={handleFiltrer} className="year-filter-form">
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={16} />
                  Année d'évaluation
                </label>
                <div className="filter-input-group">
                  <input
                    type="number"
                    placeholder="Ex: 2024"
                    value={annee}
                    onChange={(e) => setAnnee(e.target.value)}
                    min="2000"
                    max="2030"
                    className="year-input"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="filter-btn"
                    style={{ background: "linear-gradient(135deg, #0d9488 0%, #0d9488 100%)" }}
                  >
                    <Filter size={16} />
                    {loading ? "..." : "Filtrer"}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Cartes de statistiques */}
          {statistiques && (
            <div className="stats-cards">
              <div className="stat-card animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <div className="stat-card-icon" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                  <CurrencyDollar size={24} />
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-value">{formatMontantFR(statistiques.totalAnnuel)}</div>
                  <div className="stat-card-label">Total annuel {statistiques.annee}</div>
                </div>
              </div>

              <div className="stat-card animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                <div className="stat-card-icon" style={{ background: "linear-gradient(135deg, #0ee2f5ff 0%, #7c3aed 100%)" }}>
                  <Calendar size={24} />
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-value">{statistiques.totalPaiements}</div>
                  <div className="stat-card-label">Nombre de paiements</div>
                </div>
              </div>

              <div className="stat-card animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <div className="stat-card-icon" style={{ background: "linear-gradient(135deg, #ecb555ff 0%, #06c0d9ff 100%)" }}>
                  <BarChart size={24} />
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-value">{formatMontantFR(statistiques.moyenneMensuelle)}</div>
                  <div className="stat-card-label">Moyenne mensuelle</div>
                </div>
              </div>
            </div>
          )}

          {/* Graphique des paiements */}
          <div className="chart-section">
            <div className="chart-header">
              <h3 className="chart-title">Histogramme des paiements {statistiques?.annee || annee}</h3>
              {statistiques && (
                <div className="chart-stats-mini">
                  <span className="stat-mini">
                    <strong>Max:</strong> {formatMontantFR(maxMontant)}
                  </span>
                  <span className="stat-mini">
                    <strong>Min:</strong> {formatMontantFR(Math.min(...statistiques.statistiques.filter(s => s.montant > 0).map(s => s.montant)))}
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="chart-loading">
                <div className="spinner-border text-success" />
                <p>Chargement des données pour {annee}...</p>
              </div>
            ) : statistiques ? (
              <div className="chart-container">
                {/* Tableau des données */}
                <div className="table-section">
                  <div className="table-wrapper">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Mois</th>
                          <th>Montant payé</th>
                          <th>Nombre de paiements</th>
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
                            <td>
                              <span className="badge-count">
                                {stat.nombrePaiements}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Histogramme */}
                <div className="histogram-section">
                  <div className="css-bars-chart">
                    {statistiques.statistiques.map((stat, index) => {
                      const hauteurPourcentage = maxMontant > 0 ? (stat.montant / maxMontant) * 100 : 0

                      return (
                        <div key={stat.mois} className="bar-container">
                          <div className="bar-label">{stat.nomMois.substring(0, 3)}</div>
                          <div className="bar-wrapper">
                            <div
                              className="bar"
                              style={{
                                height: `${hauteurPourcentage}%`,
                                background: stat.montant > 0 ?
                                  "linear-gradient(135deg, #66dbf2ff 0%, #087096ff 100%)" :
                                  "#e5e7eb"
                              }}
                              title={`${stat.nomMois}: ${formatMontantFR(stat.montant)} (${stat.nombrePaiements} paiements)`}
                            >
                              {stat.montant > 0 && (
                                <span className="bar-value">
                                  {formatMontantFR(stat.montant)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="bar-month">{stat.nomMois}</div>
                          {stat.montant > 0 && (
                            <div className="bar-count">{stat.nombrePaiements}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="chart-empty">
                <BarChart size={48} className="text-muted mb-3" />
                <p className="text-muted">Aucune donnée disponible pour l'année {annee}</p>
                <Button
                  onClick={loadStatistiques}
                  variant="outline-primary"
                  size="sm"
                >
                  Réessayer
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
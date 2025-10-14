import { Link } from "react-router-dom"
import { Grid3x3GapFill, HouseFill, HouseSlashFill, ClockHistory } from "react-bootstrap-icons"
import "./Home.css"

export default function Home() {
  const menuItems = [
    {
      title: "Tous les compteurs",
      description: "Gérer tous vos compteurs",
      icon: <Grid3x3GapFill size={32} />,
      link: "/all-compteurs",
      color: "emerald",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
    {
      title: "Compteurs loués",
      description: "Voir les compteurs loués",
      icon: <HouseFill size={32} />,
      link: "/loues",
      color: "green",
      gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    },
    {
      title: "Compteurs libres",
      description: "Gérer les compteurs non loués",
      icon: <HouseSlashFill size={32} />,
      link: "/non-loues",
      color: "lime",
      gradient: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)",
    },
    {
      title: "Historique",
      description: "Consulter l'historique des paiements",
      icon: <ClockHistory size={32} />,
      link: "/historique",
      color: "teal",
      gradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
    },
  ]

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1 className="home-title">Bienvenue sur Assurance ARO</h1>
        <p className="home-subtitle">Gérez efficacement vos compteurs et suivez vos paiements en toute simplicité</p>
      </div>

      <div className="home-grid">
        {menuItems.map((item, index) => (
          <Link key={index} to={item.link} className="home-card" style={{ "--card-gradient": item.gradient }}>
            <div className="home-card-icon" style={{ background: item.gradient }}>
              {item.icon}
            </div>
            <div className="home-card-content">
              <h3 className="home-card-title">{item.title}</h3>
              <p className="home-card-description">{item.description}</p>
            </div>
            <div className="home-card-arrow">→</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

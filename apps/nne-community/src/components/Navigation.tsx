import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CollabBrand } from "./CollabBrand";

const items = [
  { to: "/", label: "Home", icon: "⌂" },
  { to: "/quests", label: "Chamba", icon: "◎" },
  { to: "/economy", label: "Economic OS", icon: "$" },
  { to: "/profile", label: "Invita +3 NNE", icon: "+" },
  { to: "/raffles", label: "Sorteos", icon: "✦" },
  { to: "/feed", label: "Feed", icon: "◌" },
  { to: "/rewards", label: "Rewards", icon: "◇" },
  { to: "/profile", label: "Profile", icon: "◉" }
];

const rewardItems = [
  { to: "/rewards/beats", label: "Beats" },
  { to: "/rewards/gear", label: "Equipos" },
  { to: "/rewards/ropa", label: "Ropa" },
  { to: "/rewards/servicios", label: "Servicios" },
  { to: "/rewards/acceso", label: "Acceso" }
];

export function Navigation() {
  const { user, logout } = useAuth();
  const visibleItems = user?.role === "admin"
    ? [...items, { to: "/admin", label: "Admin", icon: "✦" }]
    : items;

  return (
    <>
      <aside className="sidebar">
        <div className="brand">
          <CollabBrand compact />
          <div>
            <strong>NNE × WESTDETRO</strong>
            <span>Community · Hazlo real.</span>
          </div>
        </div>

        <nav className="nav-list">
          {visibleItems.map((item) => (
            <div key={`${item.to}-${item.label}`}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => isActive && item.label !== "Invita +3 NNE" ? "nav-button active" : "nav-button"}
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
              {item.to === "/rewards" && item.label === "Rewards" && (
                <div style={{ display: "grid", gap: 4, padding: "4px 0 8px 42px" }}>
                  {rewardItems.map((reward) => (
                    <NavLink key={reward.to} to={reward.to} style={{ fontSize: 12, opacity: .72, textDecoration: "none" }}>
                      {reward.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="next-unlock">
          <small>Próximo desbloqueo</small>
          <strong>Beat Lease · Nivel 15</strong>
          <div className="mini-progress"><span /></div>
          <button className="text-button" onClick={() => void logout()}>Cerrar sesión</button>
        </div>
      </aside>

      <nav className="mobile-navigation">
        {visibleItems.filter((item) => item.label !== "Invita +3 NNE").map((item) => (
          <NavLink
            key={`${item.to}-${item.label}`}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => isActive ? "active" : ""}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

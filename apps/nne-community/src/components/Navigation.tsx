import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const items = [
  { to: "/", label: "Home", icon: "⌂" },
  { to: "/quests", label: "Quests", icon: "◎" },
  { to: "/feed", label: "Feed", icon: "◌" },
  { to: "/rewards", label: "Rewards", icon: "◇" },
  { to: "/profile", label: "Profile", icon: "◉" }
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
          <div className="brand-mark">NN</div>
          <div>
            <strong>NNE COMMUNITY</strong>
            <span>Move different.</span>
          </div>
        </div>

        <nav className="nav-list">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => isActive ? "nav-button active" : "nav-button"}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
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
        {visibleItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
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

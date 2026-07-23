type View = "home" | "quests" | "feed" | "rewards" | "profile";

interface NavigationProps {
  activeView: View;
  onChange: (view: View) => void;
}

const items: Array<{ id: View; label: string; icon: string }> = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "quests", label: "Quests", icon: "◎" },
  { id: "feed", label: "Feed", icon: "◌" },
  { id: "rewards", label: "Rewards", icon: "◇" },
  { id: "profile", label: "Profile", icon: "◉" }
];

export function Navigation({ activeView, onChange }: NavigationProps) {
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
          {items.map((item) => (
            <button
              key={item.id}
              className={activeView === item.id ? "nav-button active" : "nav-button"}
              onClick={() => onChange(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="next-unlock">
          <small>Próximo desbloqueo</small>
          <strong>Beat Lease · Nivel 15</strong>
          <div className="mini-progress">
            <span />
          </div>
        </div>
      </aside>

      <nav className="mobile-navigation">
        {items.map((item) => (
          <button
            key={item.id}
            className={activeView === item.id ? "active" : ""}
            onClick={() => onChange(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}

export type { View };

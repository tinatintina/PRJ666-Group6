import "./BottomNav.css";
import NavIcon from "./NavIcon";

function BottomNav({ currentPage, onNavigate }) {
    const items = [
        {
            page: "home",
            label: "Home",
            available: true,
        },
        {
            page: "transactions",
            label: "Transactions",
            available: true,
        },
        {
            page: "budget",
            label: "Budget",
            available: true,
        },
        {
            page: "reports",
            label: "Reports",
            available: true,
        },
        {
            page: "profile",
            label: "Profile",
            available: true,
        },
    ];

    return (
        <nav
            className="bottom-navigation"
            aria-label="Main navigation"
        >
            {items.map((item) => (
                <button
                    key={item.page}
                    type="button"
                    className={
                        currentPage === item.page
                            ? "active-navigation"
                            : ""
                    }
                    onClick={() =>
                        onNavigate(item.page)
                    }
                    disabled={!item.available}
                    title={
                        item.available
                            ? item.label
                            : `${item.label} coming soon`
                    }
                    aria-current={
                        currentPage === item.page
                            ? "page"
                            : undefined
                    }
                >
                    <span
                        className="nav-icon-wrap"
                        aria-hidden="true"
                    >
                        <NavIcon name={item.page} />
                    </span>

                    {item.label}

                    {!item.available && (
                        <small>Coming soon</small>
                    )}
                </button>
            ))}
        </nav>
    );
}

export default BottomNav;

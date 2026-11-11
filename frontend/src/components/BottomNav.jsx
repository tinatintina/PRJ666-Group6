function BottomNav({ currentPage, onNavigate }) {
    const items = [
        {
            page: "home",
            icon: "\u2302",
            label: "Home",
            available: true,
        },
        {
            page: "transactions",
            icon: "\u2195",
            label: "Transactions",
            available: true,
        },
        {
            page: "budget",
            icon: "\u25A3",
            label: "Budget",
            available: true,
        },
        {
            page: "reports",
            icon: "\u25A5",
            label: "Reports",
            available: true,
        },
        {
            page: "profile",
            icon: "\u25CF",
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
                            : "Reports coming soon"
                    }
                    aria-current={
                        currentPage === item.page
                            ? "page"
                            : undefined
                    }
                >
                    <span aria-hidden="true">
                        {item.icon}
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
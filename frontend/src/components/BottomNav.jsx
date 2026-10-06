function BottomNav({ currentPage, onNavigate }) {
    const items = [
        { page: "home", icon: "⌂", label: "Home" },
        { page: "transactions", icon: "↕", label: "Transactions" },
        { page: "categories", icon: "▦", label: "Categories" },
        { page: "budget", icon: "▣", label: "Budget" },
        { page: "reports", icon: "▥", label: "Reports" },
        { page: "profile", icon: "●", label: "Profile" },
    ];

    function handleNavigation(page) {
        // Only these pages are currently available.
        if (page === "transactions" || page === "categories") {
            onNavigate(page);
        }
    }

    return (
        <nav className="bottom-navigation">
            {items.map((item) => (
                <button
                    key={item.page}
                    type="button"
                    className={
                        currentPage === item.page
                            ? "active-navigation"
                            : ""
                    }
                    onClick={() => handleNavigation(item.page)}
                >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                </button>
            ))}
        </nav>
    );
}

export default BottomNav;
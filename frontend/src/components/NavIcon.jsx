import "./NavIcon.css";

// Simple line icons drawn with SVG so they look the same on every
// device (text symbols like ⌂ render differently per font).
// They use currentColor, so they follow the button's text colour.
export function NavIcon({ name }) {
    const paths = {
        home: (
            <>
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9v11a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9" />
            </>
        ),
        transactions: (
            <>
                <path d="M7 3 3 7l4 4" />
                <path d="M3 7h14" />
                <path d="m17 21 4-4-4-4" />
                <path d="M21 17H7" />
            </>
        ),
        budget: (
            <>
                <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
                <path d="M3 7h16a2 2 0 0 1 2 2v3" />
                <path d="M21 12h-4a2 2 0 0 0 0 4h4z" />
            </>
        ),
        reports: (
            <>
                <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                <path d="M8 17v-4" />
                <path d="M13 17V8" />
                <path d="M18 17v-7" />
            </>
        ),
        profile: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
            </>
        ),
    };

    return (
        <svg
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {paths[name]}
        </svg>
    );
}

// Large icon shown on the right of each page's dark header.
export function PageHeaderIcon({ name }) {
    return (
        <div
            className="page-header-icon"
            aria-hidden="true"
        >
            <NavIcon name={name} />
        </div>
    );
}

export default NavIcon;

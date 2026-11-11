import { useEffect, useState } from "react";
import "./ProfilePage.css";

const currencies = [
    "CAD",
    "USD",
    "EUR",
    "GBP",
    "INR",
    "AUD",
    "JPY",
    "CNY",
];

function ProfilePage({
    userId,
    onUserUpdated,
    onLogout,
}) {
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        preferredCurrency: "CAD",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function loadProfile() {
            try {
                const response = await fetch(
                    `/api/users/${userId}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Could not load profile."
                    );
                }

                setProfile(data.user);

                setFormData({
                    firstName: data.user.firstName,
                    lastName: data.user.lastName,
                    email: data.user.email,
                    preferredCurrency:
                        data.user.preferredCurrency || "CAD",
                });
            } catch (loadError) {
                console.error(
                    "Profile loading error:",
                    loadError
                );

                setError(loadError.message);
            } finally {
                setLoading(false);
            }
        }

        if (userId) {
            loadProfile();
        }
    }, [userId]);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value,
        }));
    }

    function handleCancel() {
        setFormData({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            preferredCurrency:
                profile.preferredCurrency || "CAD",
        });

        setEditing(false);
        setError("");
        setMessage("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setMessage("");

            const response = await fetch(
                `/api/users/${userId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not update profile."
                );
            }

            setProfile(data.user);
            setFormData({
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                email: data.user.email,
                preferredCurrency:
                    data.user.preferredCurrency || "CAD",
            });

            onUserUpdated(data.user);
            setEditing(false);
            setMessage("Profile updated successfully.");
        } catch (saveError) {
            console.error(
                "Profile update error:",
                saveError
            );

            setError(saveError.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="profile-page">
                <p className="profile-state">
                    Loading profile...
                </p>
            </main>
        );
    }

    if (error && !profile) {
        return (
            <main className="profile-page">
                <p className="profile-state profile-error">
                    {error}
                </p>
            </main>
        );
    }

    const initials =
        `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""
            }`.toUpperCase();

    const memberSince = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString(
            "en-CA",
            {
                year: "numeric",
                month: "long",
            }
        )
        : "Not available";

    return (
        <main className="profile-page">
            <header className="profile-header">
                <div>
                    <p className="profile-brand">
                        SMART SPEND
                    </p>

                    <h1>My Profile</h1>

                    <p>
                        View and manage your account information.
                    </p>
                </div>

                <div className="profile-avatar">
                    {initials}
                </div>
            </header>

            <section className="profile-content">
                <div className="profile-summary-card">
                    <div className="profile-large-avatar">
                        {initials}
                    </div>

                    <div>
                        <h2>
                            {profile.firstName} {profile.lastName}
                        </h2>

                        <p>{profile.email}</p>
                        <span>Member since {memberSince}</span>
                    </div>
                </div>

                <form
                    className="profile-details-card"
                    onSubmit={handleSubmit}
                >
                    <div className="profile-card-heading">
                        <div>
                            <h2>Personal Information</h2>
                            <p>
                                Keep your account information up to
                                date.
                            </p>
                        </div>

                        {!editing && (
                            <button
                                type="button"
                                className="profile-edit-button"
                                onClick={() => {
                                    setEditing(true);
                                    setMessage("");
                                }}
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {message && (
                        <p className="profile-success">
                            {message}
                        </p>
                    )}

                    {error && profile && (
                        <p className="profile-error">
                            {error}
                        </p>
                    )}

                    <div className="profile-form-grid">
                        <div className="form-group">
                            <label htmlFor="profileFirstName">
                                First Name
                            </label>

                            <input
                                id="profileFirstName"
                                name="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={handleChange}
                                maxLength="50"
                                disabled={!editing}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="profileLastName">
                                Last Name
                            </label>

                            <input
                                id="profileLastName"
                                name="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={handleChange}
                                maxLength="50"
                                disabled={!editing}
                                required
                            />
                        </div>

                        <div className="form-group profile-full-field">
                            <label htmlFor="profileEmail">
                                Email
                            </label>

                            <input
                                id="profileEmail"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                maxLength="100"
                                disabled={!editing}
                                required
                            />
                        </div>

                        <div className="form-group profile-full-field">
                            <label htmlFor="profileCurrency">
                                Preferred Currency
                            </label>

                            <select
                                id="profileCurrency"
                                name="preferredCurrency"
                                value={formData.preferredCurrency}
                                onChange={handleChange}
                                disabled={!editing}
                            >
                                {currencies.map((currency) => (
                                    <option
                                        key={currency}
                                        value={currency}
                                    >
                                        {currency}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {editing && (
                        <div className="profile-form-actions">
                            <button
                                type="submit"
                                className="profile-save-button"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>

                            <button
                                type="button"
                                className="profile-cancel-button"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </form>

                <button
                    type="button"
                    className="profile-logout-button"
                    onClick={onLogout}
                >
                    Log Out
                </button>
            </section>
        </main>
    );
}

export default ProfilePage;
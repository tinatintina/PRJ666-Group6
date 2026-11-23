const app = require("./app");
const runMigrations = require("./config/migrations");

const PORT = 8080;

const start = async () => {
    try {
        await runMigrations();
    } catch (err) {
        console.error(
            "Could not update the database schema. " +
            "Run the files in database/migrations by hand.",
            err.message
        );
    }

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

start();

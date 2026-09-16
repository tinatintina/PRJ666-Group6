const login = (req, res) => {
    const { email, password } = req.body;

    console.log("Login request received:", email);

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    return res.status(200).json({
        success: true,
        message: "Login API is working"
    });
};

module.exports = {
    login
};
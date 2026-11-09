const express = require("express");

const {
    getUserProfile,
    updateUserProfile,
    changePassword
} = require("../controllers/userController");

const router = express.Router();

router.get("/:userId", getUserProfile);
router.put("/:userId", updateUserProfile);
router.put("/:userId/password", changePassword);

module.exports = router;

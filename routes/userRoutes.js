const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUser,
    getAllUsers,
} = require("../controllers/userController");

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/:userId").get(getAllUsers);

module.exports = router;

//DEPENDANCIES 
const express = require('express');
const router = express.Router();
const authController = require('../controllers/user-controllers');
const verifyAuthentication = require('../middleware/verifyAuthentication');
const adminOnly = require('../middleware/AdminOnly');

//I.N.D.U.C.E.S
router.get("/", verifyAuthentication, authController.getUsers);
router.get("/me", verifyAuthentication, authController.getUser);
router.put("/profile", verifyAuthentication, authController.updateProfile);
router.delete("/me", verifyAuthentication, authController.deleteAccount);
router.patch("/me/presence", verifyAuthentication, authController.updatePresence);
router.get("/admin", verifyAuthentication, adminOnly, authController.verifyVeteranAccess);
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);

module.exports = router;
const express = require("express");

const controller = require("../controllers/user");
const middleware = require("../middleware");

const router = express.Router();

router.get("/", middleware.auth, controller.profile);
router.post("/change-password", middleware.auth, controller.changePassword);

module.exports = router;

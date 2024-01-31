const express = require("express");

const controller = require("../controllers/internet");
const middleware = require("../middleware");

const router = express.Router();

router.get("/:uuid", middleware.auth, controller.index);

module.exports = router;

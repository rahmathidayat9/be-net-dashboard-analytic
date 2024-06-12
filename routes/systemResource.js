const express = require("express");

const controller = require("../controllers/systemResource");

const router = express.Router();

router.get("/:router", controller.index);

module.exports = router;

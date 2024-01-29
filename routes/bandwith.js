const express = require("express");

const controller = require("../controllers/bandwith");

const router = express.Router();

router.get("/:date", controller.index);

module.exports = router;

const express = require("express");

const controller = require("../controllers/systemResource");

const router = express.Router();

router.get("/:date", controller.index);

module.exports = router;

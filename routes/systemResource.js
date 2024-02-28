const express = require("express");

const controller = require("../controllers/systemResource");

const router = express.Router();

router.get("/:uuid", controller.index);

module.exports = router;

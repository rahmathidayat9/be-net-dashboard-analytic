const express = require("express");

const controller = require("../controllers/bandwith");

const router = express.Router();

router.get("/", controller.index);

module.exports = router;

const express = require("express");

const controller = require("../controllers/priority");
const middleware = require("../middleware");

const router = express.Router();

router.get("/", controller.index);

module.exports = router;

const express = require("express");

const controller = require("../controllers/trafficByPort");
const middleware = require("../middleware");

const router = express.Router();

router.get("/:uuid", controller.index);

module.exports = router;

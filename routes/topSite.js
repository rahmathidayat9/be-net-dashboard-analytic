const express = require("express");

const controller = require("../controllers/topSite");
// const middleware = require("../middleware");

const router = express.Router();

router.get("/:router", controller.index);

module.exports = router;

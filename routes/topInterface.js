const express = require("express");

const controller = require("../controllers/topInterface");
// const middleware = require("../middleware");

const router = express.Router();

router.get("/graph/:router", controller.getGraph);
router.get("/:router", controller.index);

module.exports = router;

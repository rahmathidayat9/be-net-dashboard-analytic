const express = require("express");

const controller = require("../controllers/topHostName");
// const middleware = require("../middleware");

const router = express.Router();

router.get("/", controller.index);
router.get("/:router", controller.show);

module.exports = router;

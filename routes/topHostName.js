const express = require("express");

const controller = require("../controllers/topHostName");
// const middleware = require("../middleware");

const router = express.Router();

router.get("/", controller.getTop);
router.get("/:uuid", controller.index);

module.exports = router;

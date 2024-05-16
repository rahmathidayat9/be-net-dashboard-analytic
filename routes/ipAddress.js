const express = require("express");

const controller = require("../controllers/ipAddress");
// const middleware = require("../middleware");

const router = express.Router();

router.get("/", controller.index);
router.get("/:id", controller.show);
router.post("/", controller.store);
router.put("/:id", controller.update);
router.delete("/:id", controller.destroy);

module.exports = router;

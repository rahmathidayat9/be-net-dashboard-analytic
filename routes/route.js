const express = require("express");

const controller = require("../controllers/route");
const middleware = require("../middleware");

const router = express.Router();

router.get("/", controller.index);
router.get("/active", controller.getActive);
router.get("/:id", controller.show);
router.post("/", controller.store);
router.put("/active/:id", controller.active);
router.put("/deactive/:id", controller.deactive);
router.put("/:id", controller.update);
router.delete("/:id", controller.destroy);

module.exports = router;

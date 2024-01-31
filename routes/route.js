const express = require("express");

const controller = require("../controllers/route");
const middleware = require("../middleware");

const router = express.Router();

router.get("/", middleware.auth, controller.index);
router.get("/:id", middleware.auth, controller.show);
router.post("/", middleware.auth, controller.store);
router.put("/active/:id", middleware.auth, controller.active);
router.put("/deactive/:id", middleware.auth, controller.deactive);
router.put("/:id", middleware.auth, controller.update);
router.delete("/:id", middleware.auth, controller.destroy);

module.exports = router;

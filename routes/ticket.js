const express = require("express");

const controller = require("../controllers/ticket");
const middleware = require("../middleware");

const router = express.Router();

router.get("/", middleware.auth, controller.index);
router.get("/count/:status", middleware.auth, controller.count);
router.get("/:id", middleware.auth, controller.show);
router.post("/", middleware.auth, controller.store);
router.post("/closed/:id", middleware.auth, controller.closed);
router.put("/pending/:id", middleware.auth, controller.pending);
router.put("/:id", middleware.auth, controller.update);
router.post("/reply/:id", middleware.auth, controller.reply);
router.post("/status/:id", middleware.auth, controller.status);
router.delete("/:id", middleware.auth, controller.destroy);

module.exports = router;

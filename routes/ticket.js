const express = require("express");

const controller = require("../controllers/ticket");
const middleware = require("../middleware");

const router = express.Router();

router.get("/", middleware.auth, controller.index);
router.get("/count/:status", middleware.auth, controller.count);
router.get("/:id", middleware.auth, controller.show);
router.post("/", middleware.auth, middleware.bottomRole, controller.store);
router.put(
  "/closed/:id",
  middleware.auth,
  middleware.upperRole,
  controller.closed
);
router.put(
  "/pending/:id",
  middleware.auth,
  middleware.upperRole,
  controller.pending
);
router.put("/reply/:id", middleware.auth, controller.reply);
router.put(
  "/status/:id",
  middleware.auth,
  middleware.upperRole,
  controller.status
);
router.delete(
  "/:id",
  middleware.auth,
  middleware.upperRole,
  controller.destroy
);

module.exports = router;

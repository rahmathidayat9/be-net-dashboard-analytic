const express = require("express");

const controller = require("../controllers/ticket");
const middleware = require("../middleware");

const router = express.Router();

router.get("/", middleware.auth, controller.index);
router.get("/:id", middleware.auth, controller.show);
router.post("/", middleware.auth, middleware.bottomRole, controller.store);
router.put("/reply/:id", middleware.auth, controller.reply);
router.delete(
  "/:id",
  middleware.auth,
  middleware.upperRole,
  controller.destroy
);

module.exports = router;

const express = require("express");

const controller = require("../controllers/user");
const middleware = require("../middleware");

const router = express.Router();

router.get("/", middleware.auth, controller.index);
router.get("/:id", middleware.auth, controller.show);
router.post("/", middleware.auth, middleware.upperRole, controller.store);
router.put("/:id", middleware.auth, middleware.upperRole, controller.update);
router.delete(
  "/:id",
  middleware.auth,
  middleware.upperRole,
  controller.destroy
);

module.exports = router;

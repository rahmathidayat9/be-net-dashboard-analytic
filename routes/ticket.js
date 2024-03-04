const express = require("express");

const controller = require("../controllers/ticket");
const middleware = require("../middleware");

const router = express.Router();

router.get("/", controller.index);
router.get("/count/:status", controller.count);
router.get("/:id", controller.show);
router.post("/", controller.store);
router.post(
  "/closed/:id",
  controller.closed
);
router.put(
  "/pending/:id",
  controller.pending
);
router.post("/reply/:id", controller.reply);
router.post(
  "/status/:id",
  controller.status
);
router.delete(
  "/:id",
  controller.destroy
);

module.exports = router;

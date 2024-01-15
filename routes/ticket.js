const express = require("express");

const controller = require("../controllers/ticket");
const middleware = require("../middleware");

const router = express.Router();

router.get("/", controller.index);
router.get("/:id", controller.show);
router.post("/", controller.store);
router.put("/reply/:id", controller.reply);
router.delete(
  "/:id",
  controller.destroy
);

module.exports = router;

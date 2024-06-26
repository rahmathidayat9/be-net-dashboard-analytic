const express = require("express");

const controller = require("../controllers/cron");

const router = express.Router();

router.get("/top_host_name", controller.top_host_name);
router.get("/top_sites", controller.top_sites);
router.get("/top_interface", controller.top_interface);
router.get("/system_resource", controller.system_resource);

module.exports = router;

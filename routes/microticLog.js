const express = require("express");

const controller = require("../controllers/microticLog");

const router = express.Router();

router.get("/upload-download/today/:uuid", controller.todayUploadDownloadRecap);
router.get("/upload-download/:uuid", controller.uploadDownload);
router.post("/upload-download/report", controller.uploadDownloadRecap);

module.exports = router;

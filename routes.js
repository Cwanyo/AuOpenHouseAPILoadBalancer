"use strict";

var contolller = require("./controller");

var express = require("express");
// RESTful route
var router = express.Router();

// Welcome route
router.route("/")
    .get(contolller.welcome_page);

// Middleware - Performance monitor
router.use(contolller.performance_monitor);

// All routes
router.route("/*")
    .all(contolller.handler);

module.exports = router;
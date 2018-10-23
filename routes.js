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

// Middleware - Monitoring user
router.use(contolller.user_monitor);

router.route("/*")
    .get(contolller.load_balancer_read)
    .post(contolller.load_balancer_write)
    .put(contolller.load_balancer_write)
    .patch(contolller.load_balancer_write)
    .delete(contolller.load_balancer_write);

module.exports = router;
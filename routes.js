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

// Set load balancer
// Read method for Slave
// Authentication routes
router.route("/api/student/login")
    .post(contolller.load_balancer_read);
router.route("/api/student/logout")
    .delete(contolller.load_balancer_read);
router.route("/api/authority/login")
    .post(contolller.load_balancer_read);
router.route("/api/authority/logout")
    .delete(contolller.load_balancer_read);
router.route("/*")
    .get(contolller.load_balancer_read);

// Write method for Master
router.route("/*")
    .post(contolller.load_balancer_write)
    .put(contolller.load_balancer_write)
    .patch(contolller.load_balancer_write)
    .delete(contolller.load_balancer_write);

module.exports = router;
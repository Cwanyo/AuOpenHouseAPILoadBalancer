"use strict";

var request = require("request");

// Master for Write Only
const master_server = "https://auopenhouse-00.herokuapp.com";
// Slave for Read Only
const slave_servers = ["https://auopenhouse-01.herokuapp.com", "https://auopenhouse-02.herokuapp.com"];

let current_server = 0;
let user_count = 0;

exports.welcome_page = function(req, res, next) {
    res.send("Welcome to AuOpenHouse Load Balancer");
}

exports.performance_monitor = (req, res, next) => {
    // Show response time in millisecond
    const start = Date.now();
    res.on("finish", () => {
        console.log("Load-Balancer Passed to | ", req.session.server, "|", req.method, req.url, "|", Date.now() - start, "ms");
        console.log(req.session)
    });

    next();
};

exports.user_monitor = (req, res, next) => {
    // Assign user number for debugging purpose
    if (req.session.user == null) {
        req.session.user = user_count;
        user_count++;
    }

    // TODO - check what if server down
    // Assign server to each user
    if (req.session.server == null) {
        req.session.server = slave_servers[current_server];
        current_server = (current_server + 1) % slave_servers.length;
    }

    next();
};

exports.load_balancer_read = (req, res, next) => {

    // Get server from session
    var user_server = req.session.server;

    const _req = request({ url: user_server + req.url }).on("error", error => {
        res.status(503).send(error.message);
    });
    req.pipe(_req).pipe(res);

};

exports.load_balancer_write = (req, res, next) => {

    const _req = request({ url: master_server + req.url }).on("error", error => {
        res.status(503).send(error.message);
    });
    req.pipe(_req).pipe(res);

};
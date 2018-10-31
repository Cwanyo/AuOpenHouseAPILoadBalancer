"use strict";

var request = require("request");

// Master for Write Only
const master_server = "https://auopenhouse-00.herokuapp.com";
// Slave for Read Only
// [server_url, status]
const slave_servers = ["https://auopenhouse-01.herokuapp.com", "https://auopenhouse-02.herokuapp.com"];

// Spacial url that can passed to Slave
const spacial_read_url = ["/api/student/login", "/api/student/logout", "/api/authority/login", "/api/authority/logout"]
const logout_url = ["/api/student/login", "/api/student/logout", "/api/authority/login", "/api/authority/logout"]

let current_server = 0;
let user_count = 0;

exports.welcome_page = function(req, res, next) {
    res.send("Welcome to AuOpenHouse Load Balancer");
}

exports.performance_monitor = (req, res, next) => {
    // Show response time in millisecond
    const start = Date.now();
    res.on("finish", () => {

        if (req.session == null) {
            return;
        }
        // Get correct used server
        var server = req.session.server;
        if ((req.method != "GET") && (!spacial_read_url.includes(req.url))) {
            server = master_server;
        }

        console.log("Load-Balancer passed | user:", req.session.user, "|", server, "|", req.method, req.url, "|", Date.now() - start, "ms");
        console.log("Session:", req.session);
    });

    next();
};

exports.server_monitor = (req, res, next) => {
    // Assign user number for debugging purpose
    if (req.session.user == null) {
        req.session.user = user_count;
        user_count++;
    }

    // Check server status
    var c = 0;
    var c_max = slave_servers.length;
    var statusCode = 500;

    (function check_server_status() {
        // If c did not reach the maximum number of attempt
        if (c <= c_max) {
            if (statusCode >= 500) {
                // Assign server to each user
                if ((req.session.server == null) || (c != 0)) {
                    req.session.server = assign_server();
                }

                request(req.session.server + "/test-connection", function(err, res, body) {
                    c++;
                    statusCode = res.statusCode;
                    console.log("check_server_status:", c, "|", req.session.server, "|", statusCode);

                    check_server_status();
                });
            } else if (statusCode < 500) {
                next();
            }
        } else {
            // If c reach the maximum number of attempt
            console.log("check_server_status: maxout");
            next();
        }
    }());
};

function assign_server() {
    var server = slave_servers[current_server];
    current_server = (current_server + 1) % slave_servers.length;

    return server;
}

exports.load_balancer_read = (req, res, next) => {
    // Get user selected server from session
    var user_server = req.session.server;

    const _req = request({ url: user_server + req.url }).on("error", error => {
        res.status(503).send(error.message);
    });
    req.pipe(_req).pipe(res);

    // If user logout from api server, delete session_lb
    if ((req.method == "DELETE") && (logout_url.includes(req.url))) {
        req.session = null;
    }
};

exports.load_balancer_write = (req, res, next) => {
    const _req = request({ url: master_server + req.url }).on("error", error => {
        res.status(503).send(error.message);
    });
    req.pipe(_req).pipe(res);
};
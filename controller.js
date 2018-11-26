"use strict";

var request = require("request");
var crypto = require("crypto");

// Master for Write Only
const master_servers = ["https://auopenhouse-00.herokuapp.com", "https://auopenhouse-0.herokuapp.com"]
    // Slave for Read Only
    // [server_url, status]
const slave_servers = ["https://auopenhouse-01.herokuapp.com", "https://auopenhouse-02.herokuapp.com"];

// Spacial url that can passed to Slave
const spacial_read_url = ["/api/student/login", "/api/student/logout", "/api/authority/login", "/api/authority/logout"]
const logout_url = ["/api/student/logout", "/api/authority/logout"]

let current_master = 0;
let current_slave = 0

exports.welcome_page = function(req, res, next) {
    res.send("Welcome to AuOpenHouse Load Balancer");
}

exports.performance_monitor = (req, res, next) => {
    // Assign user id for debugging purpose
    if (req.session.user_id == null) {
        // Random 20 characters of hex (1 byte = 2 hex characters)
        req.session.user_id = crypto.randomBytes(10).toString('hex');
        console.log("===> Assigned new user_id:", req.session.user_id);
    }

    // // Show response time in millisecond
    // const start = Date.now();

    // res.on("finish", () => {

    //     if (req.session == null) {
    //         return;
    //     }

    //     // Get correct used server
    //     var server = req.session.slave_server;
    //     if ((req.method != "GET") && (!spacial_read_url.includes(req.url))) {
    //         server = req.session.master_server;
    //     }

    //     console.log("----------------------------------------------------------------------------------------------------------------")
    //     console.log(req.session);
    //     console.log("Load-Balancer passed | user_id:", req.session.user_id, "|", server, "|", req.method, req.url, "|", Date.now() - start, "ms");
    //     console.log("________________________________________________________________________________________________________________")
    // });

    next();
};

function assign_master_server() {
    var server = master_servers[current_master];
    current_master = (current_master + 1) % master_servers.length;

    return server;
}

function assign_slave_server() {
    var server = slave_servers[current_slave];
    current_slave = (current_slave + 1) % slave_servers.length;

    return server;
}

exports.load_balancer_read = (req, res, next) => {
    // Check slave server status
    var c = 0;
    var c_max = slave_servers.length;
    var statusCode = 500;

    (function check_server_status() {
        // If c did not reach the maximum number of attempt
        if (c <= c_max) {
            if (statusCode >= 500) {
                // Assign server to each user
                if ((req.session.slave_server == null) || (c != 0)) {
                    req.session.slave_server = assign_slave_server();
                }

                request(req.session.slave_server + "/test-connection", function(err, res, body) {
                    c++;
                    statusCode = res.statusCode;
                    console.log("user_id:", req.session.user_id, "=> check_slave_server_status:", c, "time |", req.session.slave_server, "|", statusCode);

                    check_server_status();
                });
            } else if (statusCode < 500) {
                // If connected then pass the request
                console.log("user_id:", req.session.user_id, "=> check_slave_server_status:", req.session.slave_server, "=connected");

                const _req = request({ url: req.session.slave_server + req.url }).on("error", error => {
                    res.status(503).send(error.message);
                });
                req.pipe(_req).pipe(res);

                // Log
                console.log(req.session);
                console.log("Load-Balancer passed | user_id:", req.session.user_id, "|", req.session.slave_server, "|", req.method, req.url);
                console.log("________________________________________________________________________________________________________________")

                // If user logout from api server, delete session_lb
                if ((req.method == "DELETE") && (logout_url.includes(req.url))) {
                    req.session = null;
                }
            }
        } else {
            // If c reach the maximum number of attempt
            console.log("user_id:", req.session.user_id, "=> check_slave_server_status: maxout");
            console.log("________________________________________________________________________________________________________________")
            return res.sendStatus(500);
        }
    }());

};

exports.load_balancer_write = (req, res, next) => {
    // Check master server status
    var c = 0;
    var c_max = master_servers.length;
    var statusCode = 500;

    (function check_server_status() {
        // If c did not reach the maximum number of attempt
        if (c <= c_max) {
            if (statusCode >= 500) {
                // Assign server to each user
                if ((req.session.master_server == null) || (c != 0)) {
                    req.session.master_server = assign_master_server();
                }

                request(req.session.master_server + "/test-connection", function(err, res, body) {
                    c++;
                    statusCode = res.statusCode;
                    console.log("user_id:", req.session.user_id, "=> check_master_server_status:", c, "time |", req.session.master_server, "|", statusCode);

                    check_server_status();
                });
            } else if (statusCode < 500) {
                // If connected then pass the request
                console.log("user_id:", req.session.user_id, "=> check_master_server_status:", req.session.master_server, "=connected");

                const _req = request({ url: req.session.master_server + req.url }).on("error", error => {
                    res.status(503).send(error.message);
                });
                req.pipe(_req).pipe(res);

                // Log
                console.log(req.session);
                console.log("Load-Balancer passed | user_id:", req.session.user_id, "|", req.session.slave_server, "|", req.method, req.url);
                console.log("________________________________________________________________________________________________________________")
            }
        } else {
            // If c reach the maximum number of attempt
            console.log("user_id:", req.session.user_id, "=> check_master_server_status: maxout");
            console.log("________________________________________________________________________________________________________________")
            return res.sendStatus(500);
        }
    }());

};
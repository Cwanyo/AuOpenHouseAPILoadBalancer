"use strict";

var request = require("request");

const servers = ["https://auopenhouse-00.herokuapp.com", "https://auopenhouse-01.herokuapp.com", "https://auopenhouse-02.herokuapp.com"];
// const servers = ["http://localhost:3000", "https://auopenhouse.herokuapp.com"];
// const servers = ["http://localhost:3000"];
// const servers = ["https://auopenhouse.herokuapp.com", "https://auopenhouse-00.herokuapp.com"];

let cur = 0;
let user_count = 0;

exports.welcome_page = function(req, res, next) {
    res.send("Welcome to AuOpenHouse Load Balancer");
}

exports.performance_monitor = (req, res, next) => {
    // Show response time in millisecond
    const start = Date.now();
    res.on("finish", () => {
        console.log("Load-Balancer Passed to | ", servers[cur], "|", req.method, req.url, "|", Date.now() - start, "ms");
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

    next();
};

exports.handler = (req, res, next) => {
    const _req = request({ url: servers[cur] + req.url }).on("error", error => {
        res.status(503).send(error.message);
    });
    req.pipe(_req).pipe(res);

    cur = (cur + 1) % servers.length;
};
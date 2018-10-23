"use strict";

var request = require("request");

// const servers = ["https://auopenhouse-00.herokuapp.com", "https://auopenhouse-01.herokuapp.com", "https://auopenhouse-02.herokuapp.com"];
const servers = ["http://localhost:3000", "https://auopenhouse.herokuapp.com"];
let cur = 0;

exports.welcome_page = function(req, res, next) {
    res.send("Welcome to AuOpenHouse Load Balancer");
}

exports.performance_monitor = (req, res, next) => {
    // Show response time in millisecond
    const start = Date.now();
    res.on("finish", () => {
        console.log("Load-Balancer Passed to ", servers[cur], req.method, req.url, "|", Date.now() - start, "ms");
        console.log(req.session)
    });

    next();
};

exports.handler = (req, res, next) => {
    const _req = request({ url: servers[cur] + req.url }).on("error", error => {
        res.status(503).send(error.message);
    });
    req.pipe(_req).pipe(res);

    cur = (cur + 1) % servers.length;
};
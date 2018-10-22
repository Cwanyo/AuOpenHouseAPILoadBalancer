var express = require("express"),
    request = require('request'),
    cors = require('cors'),
    path = require("path"),
    bodyParser = require("body-parser"),
    expressValidator = require("express-validator"),
    cookieSession = require('cookie-session'),
    app = express(),
    port = process.env.PORT || 8080;

// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

// app.use(express.static(path.join(__dirname, "public")));
// app.use(cors({ credentials: true, origin: true }));
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(expressValidator());

const servers = ['http://localhost:3000'];
let cur = 0;

// app.set("trust proxy", 1);

const handler = (req, res) => {
    console.log("Load-Balancer Passed at ", servers[cur], req.method, req.url);

    const _req = request({ url: servers[cur] + req.url }).on('error', error => {
        res.status(500).send(error.message);
    });
    req.pipe(_req).pipe(res);
    cur = (cur + 1) % servers.length;
};


const server = express().all("*", handler);

server.listen(port);
console.log("AuOpenHouse Load Balancer started on port :: %s", port);
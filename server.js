var express = require("express"),
    cors = require("cors"),
    expressValidator = require("express-validator"),
    cookieSession = require("cookie-session"),
    app = express(),
    port = process.env.PORT || 8080;

app.use(cors({ credentials: true, origin: true }));
app.use(expressValidator());

app.set("trust proxy", 1);

// Cookie Session
app.use(cookieSession({
    secret: process.env.SECRET,
    maxAge: 60 * 60 * 1000 * 24 // <- hours session expire
}));

// Routes
app.use("", require("./routes"));

// Start Server
var server = app.listen(port, function() {
    console.log("AuOpenHouse Load Balancer server started on port :: %s", server.address().port);
});
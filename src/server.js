require("dotenv").config();
const express = require("express");
const server = express();



/* -------------------------
    Middleware
-------------------------- */
server.use(express.static("public"));

const helmet = require("helmet");
/* Helmet CSP, CORS, Body Parser, Rate-Limiter */
server.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "data:"],
                imgSrc: ["'self'"],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
    })
);

const cors = require("cors");
server.use(cors());

const bodyParser = require("body-parser");
server.use(bodyParser.json({ limit: "1mb" }));

const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
});
server.use(limiter);

/* -------------------------
    Routes
-------------------------- */
const path = require("path");

const secretRoutes = require("./routes/secret");
const { Server } = require("http");
server.use("/api/secret", secretRoutes);

server.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
});

server.get("/secret", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "secret.html"));
});

server.get("/secret/:id", (req, res) => {
    res.redirect(`/secret?id=${req.params.id}`);
});

let PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
})

module.exports = server;
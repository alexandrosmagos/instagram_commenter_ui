require("dotenv").config({ path: "./settings/.env" });
const express = require("express");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
const proxyModule = require("./proxies.js");
const handleSocketConnection = require("./utils.js");

// Initialize database
proxyModule.initDatabase();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session
app.use(
    session({
        secret: "2193n7y!FC$@#$!wqdSsadsa",
        resave: false,
        saveUninitialized: true,
    })
);

// Serve static files from 'public' directory
app.use(express.static("public"));

// Routes
app.get("/", ensureAuthenticated, (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/views/login.html");
});

app.post("/login", handleLogin);

// Create server
const server = http.createServer(app);

// Initialize socket.io
const io = new Server(server);
handleSocketConnection(io);

// Start server
server.listen(3069, () => {
    console.log("Server listening on *:3000");
});

// Middleware for ensuring user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect("/login");
}

// Middleware for handling login
async function handleLogin(req, res) {
    const { username, password } = req.body;
    try {
        const user = await proxyModule.loginUser(username, password);
        req.session.user = user;
        res.redirect("/");
    } catch (error) {
        res.redirect("/login");
    }
}
require("dotenv").config({ path: "./settings/.env" });
const os = require('os');
const express = require("express");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");

const handleSocketConnection = require("./utils.js");
const { checkIfUserExists, registerUser, loginUser } = require('./user_utils');

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session
app.use(
    session({
        secret: process.env.session_secret,
        resave: false,
        saveUninitialized: true,
    })
);

// Serve static files from 'public' directory
app.use(express.static("public"));

// Routes
app.get("/", ensureAuthenticated, (req, res) => {
    res.render('index.ejs', { username: req.session.user.username });
});

app.get('/login', (req, res) => {
    res.render('auth.ejs', { action: 'login' });
});

app.get('/register', (req, res) => {
    res.render('auth.ejs', { action: 'register' });
});

app.post("/login", handleLogin);

app.post("/register", handleRegister);

app.post("/logout", function(req, res){
    req.session.destroy(function(err) {
        if(err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

// Create server
const server = http.createServer(app);

// Initialize socket.io
const io = new Server(server);
handleSocketConnection(io);


// Middleware for ensuring user is authenticated
async function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    const userExists = await checkIfUserExists();
    if (!userExists) return res.redirect("/register");
    res.redirect("/login");
}

// Middleware for handling login
async function handleLogin(req, res) {
    const { username, password } = req.body;
    try {
        const user = await loginUser(username, password);
        req.session.user = user;
        res.redirect("/");
    } catch (error) {
        res.redirect("/login");
    }
}

// Middleware for handling registration
async function handleRegister(req, res) {
    const { username, password } = req.body;

	if (!username || !password) return res.redirect("/register");
	if (username.length < 3 || password.length < 3) return res.redirect("/register");

    try {
        await registerUser(username, password);
        res.redirect("/login");
    } catch (error) {
        res.redirect("/register");
    }
}

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
	const interfaces = os.networkInterfaces();
	const addresses = [];
	for (const name of Object.keys(interfaces)) {
		for (const interface of interfaces[name]) {
			const { address, family, internal } = interface;
			if (family === 'IPv4' && !internal) {
				addresses.push(address);
			}
		}
	}
    console.log(`Server running on http://${addresses[0]}:${port} or http://127.0.0.1:${port}`);
});

require("dotenv").config({ path: "./settings/.env" });
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const proxyModule = require("./proxies.js");
const fetch = require('node-fetch');

// Initial Configurations and Variables
let settings = require("./settings/settings.json");
const settings_location = "./settings/settings.json";
const cookie_location = "./settings/cookies.json";
const logs_location = "./settings/logs.txt";
let browser, page, io;
let is429 = false, isDelaying = false, errorOccurred = false;

// Checking for initial setup
init_settings();

// Module Exports
module.exports = function (socketIO) {
    io = socketIO;
    io.on("connection", handleSocketConnection);
};


async function startBot() {
	settings.botRunning = true;
	updateSetting("botRunning", settings.botRunning);
	log(`Bot has started at ${new Date().toLocaleTimeString()}`);

	const spamPauseUntil = settings.spamPauseUntil || 0;
	if (Date.now() < spamPauseUntil) {
		isDelaying = true;
		const delay = spamPauseUntil - Date.now();
		log(`[${new Date().toLocaleTimeString()}] Pausing due to spam detection until ${new Date(spamPauseUntil).toLocaleTimeString()}`);
		await new Promise((resolve) => setTimeout(resolve, delay));
		isDelaying = false;
		updateSetting("spamPauseUntil", 0);
	}

	while (settings.botRunning && new Date() < new Date(settings.stopDate)) {
        while (isDelaying) {
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Check every 5 seconds
        }

        try {
            await page.waitForXPath('//a[contains(@href, "/accounts/login/?next=")]', { timeout: 3000 });
            const loginCheck = await page.$x('//a[contains(@href, "/accounts/login/?next=")]');

            // if not logged in, log in
            if (loginCheck.length > 0) {
                await login();
            }
        } catch (error) {
            // console.log(`[${new Date().toLocaleTimeString()}] User is still logged in`);
        }

        const delay = getRandomDelay(settings.commentMinSec * 1000, settings.commentMaxSec * 1000);

        // If enough time has passed since the last comment, comment again
        if (Date.now() - settings.lastCommented > delay) {
            await commentOnPost();
            
            if (!errorOccurred) {
                updateSetting("last429", "");
                updateSetting("spamPauseUntil", 0);
                incrementCounter();
            }
        }

        // update cookies file with current cookies
        const cookies = await page.cookies();
        fs.writeFileSync(cookie_location, JSON.stringify(cookies));

        await new Promise((resolve) => setTimeout(resolve, 5000)); // Check every 5 seconds
    }

	if (!settings.botRunning) {
		log(`Bot has been stopped at ${new Date().toLocaleTimeString()}`);
	}
}

function stopBot() {
	settings.botRunning = false;
	updateSetting("botRunning", settings.botRunning);
}

async function init_browser() {
	browser = await puppeteer.launch({ headless: "new", executablePath: "/usr/bin/chromium-browser" }); //hidden
	// browser = await puppeteer.launch({ headless: false, executablePath: "/usr/bin/chromium-browser" }); //shown
	page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en,el-GR;q=0.9,el;q=0.8'
    });

	await page.setRequestInterception(true);
	page.on("request", (request) => {
		const url = request.url();

		if (settings.saveData && (url.includes(".jpg") || url.includes(".png") || url.includes(".mp4"))) {
			// console.log(`[${new Date().toLocaleTimeString()}] Blocked ${url} due to saveData setting`);
			request.abort();
		} else if (url.startsWith("https://www.instagram.com/api/v1/web/search/topsearch/")) {
			request.abort();
		} else {
			request.continue();
		}
	});

	page.on("response", async (response) => {
		const status = response.status();

		if (status === 429 && !is429) {
			is429 = true;
			errorOccurred = true;
			log(`[${new Date().toLocaleTimeString()}] Pausing for 30 minutes due to 429 error with Retry-After header value: ${response.headers()["retry-after"]}. `);
            if (settings.pushover_notifications) {
                sendPushoverNotification('429..', `[${new Date().toLocaleTimeString()}] Pausing for 30 minutes due to 429 error with Retry-After header value: ${response.headers()["retry-after"]}. `);
            }

			updateSetting("last429", new Date().toISOString());

			isDelaying = true;

			await new Promise((resolve) => setTimeout(resolve, 1800000)); //30 min

			isDelaying = false;
			is429 = false;
			return;
		}

		if (status === 400) {
			let json;
			try {
				json = await response.json();
			} catch {
				return;
			}

			if (json.spam) {
				if (json.feedback_message && json.feedback_message.includes("until")) {
					const dateString = json.feedback_message.match(/\d{4}-\d{2}-\d{2}/)[0];

					let untilDate = new Date(dateString);
					untilDate.setDate(untilDate.getDate() + 1);

					const delay = untilDate.getTime() - Date.now();

					log(`[${new Date().toLocaleTimeString()}] Spam detected. Pausing until ${dateString}.`);
                    if (settings.pushover_notifications) {
                        sendPushoverNotification('Spam Detected..', `[${new Date().toLocaleTimeString()}] Spam detected. Pausing until ${dateString}.`);
                    }
					updateSetting("spamPauseUntil", untilDate);

					isDelaying = true;
					errorOccurred = true;

					await new Promise((resolve) => setTimeout(resolve, delay)); // Delay for the specified time

					isDelaying = false;
					return;
				}
			}

			if (!is429) {
				is429 = true;
				log(`[${new Date().toLocaleTimeString()}] Pausing for 30 minutes due to 429 error with Retry-After header value: ${response.headers()["retry-after"]}. `);

				updateSetting("last429", new Date().toISOString());

				isDelaying = true;

				await new Promise((resolve) => setTimeout(resolve, 1800000)); // 30 min

				isDelaying = false;
				is429 = false;
				return;
			}
		}

		if (status === 401) {
			log(`[${new Date().toLocaleTimeString()}] Received ${status} error for ${response.url()}, logging in`);
            if (settings.pushover_notifications) {
                sendPushoverNotification('401..', `[${new Date().toLocaleTimeString()}] Received ${status} error for ${response.url()}, logging in`);
            }
			await login();
			return;
		}

		if (status >= 400 && status < 600) {
			log(`[${new Date().toLocaleTimeString()}] Received ${status} error for ${response.url()}`);
            if (settings.pushover_notifications) {
                sendPushoverNotification(`${status}..`, `[${new Date().toLocaleTimeString()}] Received ${status} error for ${response.url()}`);
            }
		}
	});

	if (fs.existsSync(cookie_location)) {
		const cookies = JSON.parse(fs.readFileSync(cookie_location, "utf8"));
		if (cookies.length !== 0) {
			for (let cookie of cookies) {
				await page.setCookie(cookie);
			}
			log(`[${new Date().toLocaleTimeString()}] Session has been loaded in the browser`);
		} else {
			await login();
		}
	} else {
		// cookie consent
		const cookies = [
			{
				name: "csrftoken",
				value: "pbHyoTMf6T0vYSGOroBufhgEYDuuB3dh",
				domain: ".instagram.com",
				path: "/",
				expires: 1719482829.245004,
				httpOnly: false,
				secure: true,
				sameSite: "None",
			},
			{
				name: "ig_did",
				value: "9B911CBB-8EA9-469B-9E12-43B33519D1FB",
				domain: ".instagram.com",
				path: "/",
				expires: 1722593229.245066,
				httpOnly: true,
				secure: true,
				sameSite: "None",
			},
			{
				name: "mid",
				value: "ZJ1XzQALAAFuJQ4wn8MAXAtIps42",
				domain: ".instagram.com",
				path: "/",
				expires: 1722593229.24505,
				httpOnly: false,
				secure: true,
				sameSite: "None",
			},
		];

		await page.setCookie(...cookies);
		await login();
	}

	await page.goto(settings.mediaLink);
}

function init_settings() {
    const default_settings = {
        stopDate: "2023-09-01",
        mediaLink: "",
        lastCommented: "0",
        commentMinSec: "350",
        commentMaxSec: "900",
        last429: "",
        spamPauseUntil: 0,
        counter: 0,
        botRunning: false,
        saveData: true,
        proxies_enabled: false,
        pushover_notifications: false
    };

    if (!fs.existsSync(settings_location)) {
        fs.writeFileSync(settings_location, JSON.stringify(default_settings, null, 2));
        log("Default / Initial settings applied.");
    } else {
        const currentSettings = JSON.parse(fs.readFileSync(settings_location, "utf8"));
        let hasMissingSettings = false;

        for (const key in default_settings) {
            if (!(key in currentSettings)) {
                currentSettings[key] = default_settings[key];
                hasMissingSettings = true;
            }
        }

        if (hasMissingSettings) {
            fs.writeFileSync(settings_location, JSON.stringify(currentSettings, null, 2));
            log("Missing default settings added.");
        }
    }
}

async function login() {
	log(`[${new Date().toLocaleTimeString()}] User is not logged in. Redirecting to the login page...`);

	await page.goto("https://www.instagram.com/accounts/login/");
	await page.waitForSelector('input[name="username"]');
	await page.type('input[name="username"]', process.env.IG_USERNAME);
	await page.type('input[name="password"]', process.env.IG_PASSWORD);
	await page.click('button[type="submit"]');

	await page.waitForSelector('textarea[aria-label="Add a comment…"]');

	const cookies = await page.cookies();
	fs.writeFileSync(cookie_location, JSON.stringify(cookies, null, 2));

	log(`[${new Date().toLocaleTimeString()}] User has been logged in`);
}

async function commentOnPost() {
	const users = ["@koutsoupias_dimitris", "@spyrosmillas", "@eva.kmt", "@periklis_gousios", "@pxatsos"];

	const randomUsers = users.sort(() => 0.5 - Math.random()).slice(0, 3);

	const comment = `${randomUsers[0]} ${randomUsers[1]} ${randomUsers[2]} `;

	try {
		await page.waitForSelector('textarea[aria-label="Add a comment…"]');
	} catch (error) {
		await login();
		await page.waitForSelector('textarea[aria-label="Add a comment…"]');
	}

	await page.type('textarea[aria-label="Add a comment…"]', comment, { delay: 60 });

	page.waitForTimeout(350);
	await page.keyboard.press("Enter");

	log(`[${new Date().toLocaleTimeString()}] Commented '${comment}'`);
    settings.lastCommented = Date.now();

	await new Promise((resolve) => setTimeout(resolve, 5000));
}


// Socket Handling
async function handleSocketConnection(socket) {
    console.log("User connected");

    const lines = await getLast20Lines();
    const proxies = await proxyModule.initData();

    socket.emit("data", { 
        settings: settings, 
        lines: lines, 
        env: { IG_USERNAME: process.env.IG_USERNAME, IG_PASSWORD: process.env.IG_PASSWORD, webshare_token: process.env.webshare_token, pushoverToken: process.env.pushoverToken, pushoverUser: process.env.pushoverUser }, 
        proxies });

    socket.on("start", async () => {
        console.log('Received "start" event');
        const last429 = new Date(settings.last429);
        const timeSinceLast429 = Date.now() - last429.getTime();

        // Check if at least 30 minutes have passed since the last 429
        if (timeSinceLast429 < 30 * 60 * 1000) {
            const remainingTime = 30 * 60 * 1000 - timeSinceLast429;
            log(`Not enough time has passed since the last 429. Please wait ${remainingTime / 60000} minutes.`);

            await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        await init_browser();
        await startBot();
    });

    socket.on("stop", () => {
        console.log('Received "stop" event');
        stopBot();
    });

    socket.on("changeSetting", ({ setting, value }) => {
        const envSettings = ["IG_USERNAME", "IG_PASSWORD", "webshare_token", "pushoverUser", "pushoverToken"];

        if (envSettings.includes(setting)) {
            return updateEnv(setting, value);
        }

        updateSetting(setting, value);
    });

    socket.on('countrySelected', (selectedCountry) => {
        console.log('Country selected: ' + selectedCountry);
        
        proxyModule.getCountryCities(selectedCountry).then((cities) => {
            socket.emit('cities', cities);
        });
    });
}

// Helper Functions
function getLast20Lines() {
	return new Promise((resolve, reject) => {
		if (fs.existsSync(logs_location)) {
			const rl = readline.createInterface({
				input: fs.createReadStream(logs_location),
				crlfDelay: Infinity,
			});

			let lines = [];

			rl.on("line", (line) => {
				lines.push(line);
			});

			rl.on("close", () => {
				let lastLines = lines.slice(-20);
				resolve(lastLines.join("\n"));
			});

			rl.on("error", reject);
		} else {
			resolve([]);
		}
	});
}

function sendPushoverNotification(title, message) {
  const pushoverAPIUrl = 'https://api.pushover.net/1/messages.json';
  const pushoverToken = process.env.pushoverToken;
  const pushoverUser = process.env.pushoverUser;

  const data = {
    token: pushoverToken,
    user: pushoverUser,
    title: title,
    message: message,
  };

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };

  fetch(pushoverAPIUrl, requestOptions)
    .then((response) => {
      if (response.ok) {
        console.log('Pushover notification sent successfully');
      } else {
        throw new Error('Failed to send Pushover notification');
      }
    })
    .catch((error) => {
      console.error('Error sending Pushover notification:', error);
    });
}

function getRandomDelay(min, max) {
	return Math.random() * (max - min) + min;
}

function incrementCounter() {
	if (!settings.counter) {
		settings.counter = 0;
	}

	settings.counter += 1;

	updateSetting("counter", settings.counter);

	return settings.counter;
}

function updateSetting(setting, value) {
	settings[setting] = value;
	fs.writeFileSync(settings_location, JSON.stringify(settings));
}

function updateEnv(setting, value) {
	const envPath = path.join(__dirname, ".env");
	let envFile = fs.readFileSync(envPath, "utf8");
	const lines = envFile.split("\n");

	const settingLineIndex = lines.findIndex((line) => line.startsWith(setting));
	if (settingLineIndex >= 0) {
		lines[settingLineIndex] = `${setting}='${value}'`;
	} else {
		lines.push(`${setting}='${value}'`);
	}

	envFile = lines.join("\n");
	fs.writeFileSync(envPath, envFile);
}

function log(message) {
	console.log(message);
	io.emit("log", message);

	if (!fs.existsSync(logs_location)) {
		fs.writeFileSync(logs_location, "");
	}

	fs.appendFile(logs_location, message + "\n", (err) => {
		if (err) {
			console.error("Failed to write to logs.txt:", err);
		}
	});
}
require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs");


// const stopDate = new Date('2023-09-01T20:00:00'); // end of giveaway
// const media_link = "https://www.instagram.com/p/CtzKZhuL7tN/"; //giveaway link
// const counterFile = './counter.json';
// const comment_min_sec = 55;
// const comment_max_sec = 120;

const settings = require('./settings.json');

let browser;
let page;
let is429 = false;
let isDelaying = false;

async function init_browser() {
	browser = await puppeteer.launch({ headless: 'new', executablePath: '/usr/bin/chromium-browser' });
	// browser = await puppeteer.launch({ headless: false });
	page = await browser.newPage();

	await page.setRequestInterception(true);
	page.on('request', (request) => {
		if (request.url().startsWith("https://www.instagram.com/api/v1/web/search/topsearch/")) {
			request.abort();
		} else {
			request.continue();
		}
	});
	

	page.on('response', async response => {
		const status = response.status();
		if (status >= 400 && status < 600) {
			console.log(`[${new Date().toLocaleTimeString()}] Received ${status} error for ${response.url()}`);
		}

		if (status === 429 && !is429) {
			is429 = true;
			console.log(`[${new Date().toLocaleTimeString()}] Received ${status} error with Retry-After header value: ${response.headers()['retry-after']}`);
			console.log(`[${new Date().toLocaleTimeString()}] Pausing for 30 minutes due to 429 error`);

            // Indicate that we are now delaying
            isDelaying = true;

            // Pause for 30 minutes
            await new Promise(resolve => setTimeout(resolve, 1800000));

            isDelaying = false; // Reset the flag after the delay
            is429 = false;
		}
	});

	if (fs.existsSync("./cookies.json")) {
		const cookies = JSON.parse(fs.readFileSync("./cookies.json", "utf8"));
		if (cookies.length !== 0) {
			for (let cookie of cookies) {
				await page.setCookie(cookie);
			}
			console.log(`[${new Date().toLocaleTimeString()}] Session has been loaded in the browser`);
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

	await page.goto(settings.media_link);
}

async function login() {
	console.log(`[${new Date().toLocaleTimeString()}] User is not logged in. Redirecting to the login page...`);

	await page.goto("https://www.instagram.com/accounts/login/");
	await page.waitForSelector('input[name="username"]');
	await page.type('input[name="username"]', process.env.IG_USERNAME);
	await page.type('input[name="password"]', process.env.IG_PASSWORD);
	await page.click('button[type="submit"]');

	await page.waitForSelector('textarea[aria-label="Add a comment…"]');

	// After successful login, save cookies
	const cookies = await page.cookies();
	fs.writeFileSync("./cookies.json", JSON.stringify(cookies, null, 2));
}

async function commentOnPost() {
	// await page.goto(media_link);

	const users = ["@koutsoupias_dimitris", "@spyrosmillas", "@eva.kmt", "@periklis_gousios", "@pxatsos"];

	const randomUsers = users.sort(() => 0.5 - Math.random()).slice(0, 3);

	const comment = `${randomUsers[0]} ${randomUsers[1]} ${randomUsers[2]} `;

	await page.waitForSelector('textarea[aria-label="Add a comment…"]');

	await page.type('textarea[aria-label="Add a comment…"]', comment, { delay: 60 });

	page.waitForTimeout(350);
	await page.keyboard.press("Enter");
    
	console.log(`[${new Date().toLocaleTimeString()}] Commented '${comment}'`);

	await new Promise((resolve) => setTimeout(resolve, 10000));
}

function getRandomDelay(min, max) {
  return Math.random() * (max - min) + min;
}

function incrementCounter() {
  let counter;
  if (fs.existsSync(settings.counterFile)) {
    counter = JSON.parse(fs.readFileSync(settings.counterFile));
    counter++;
  } else {
    counter = 1;
  }
  fs.writeFileSync(settings.counterFile, JSON.stringify(counter));
  return counter;
}

(async () => {
    await init_browser();

    while (new Date() < settings.stopDate) {
        if (!isDelaying) { // Only proceed if we are not in a delay
            
            // check if user is logged in
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

            await commentOnPost();
            incrementCounter();
        }
        await new Promise((resolve) => setTimeout(resolve, getRandomDelay(settings.comment_min_sec * 1000, settings.comment_max_sec * 1000)));
    }

    await browser.close();
    let counter = JSON.parse(fs.readFileSync(settings.counterFile));
    console.log(`End of giveaway. Total comments posted: ${counter}. Closing browser. Good luck!`)
})();
// Initialize Variables
const socket = io();
const { logsArea, commentsPosted, daysUntilEnd, endDatePicker, minDelay, maxDelay, timeSinceError_title, timeSinceError_body, 
startButton, stopButton, mediaPostLink, clearLogs_btn, saveDataCheckbox, proxyToggle, totalProxies, availableCountries, availableCities, webshare_token_input, 
pushover_notifications_toggle, pushover_userKey, pushover_appkey } = initializeDOMElements();

// Set Event Listeners
setSocketEvents();
setInputEventListeners();
setButtonEventListeners();

// Function Definitions
function initializeDOMElements() {
	return {
		logsArea: document.getElementById("logs"),
		commentsPosted: document.getElementById("commentsPosted"),
		daysUntilEnd: document.getElementById("daysUntilEnd"),
		endDatePicker: document.getElementById("endDate"),
		minDelay: document.getElementById("minDelay"),
		maxDelay: document.getElementById("maxDelay"),
		timeSinceError_title: document.getElementById("timeSinceError_title"),
		timeSinceError_body: document.getElementById("timeSinceError_body"),
		startButton: document.getElementById("startButton"),
		stopButton: document.getElementById("stopButton"),
		mediaPostLink: document.getElementById("mediaPostLink"),
		clearLogs_btn: document.getElementById("clearLogs"),
		saveDataCheckbox: document.getElementById("saveDataCheckbox"),
		proxyToggle: document.getElementById("proxyToggle"),
		totalProxies: document.getElementById("totalProxies"),
		availableCountries: document.getElementById("availableCountries"),
		availableCities: document.getElementById("availableCities"),
		webshare_token_input: document.getElementById("webshare_token"),
		pushover_notifications_toggle: document.getElementById("pushover_notifications_toggle"),
		pushover_userKey: document.getElementById("pushoverUser"),
		pushover_appkey: document.getElementById("pushoverToken"),
		usernames: document.getElementById("usernames"),
		runningOn: document.getElementById("runningOn"),
		chromium_headless: document.getElementById("chromium_headless"),
	};
}

function setSocketEvents() {
	socket.on("log", (msg) => {
		// Update the logs area with the new log
		logsArea.value += msg + "\n";
		logsArea.scrollTop = logsArea.scrollHeight;

		if (msg.includes("] Commented '")) {
			commentsPosted.innerText = parseInt(commentsPosted.innerText) + 1;
		}
	});

	// socket on cities
	socket.on("cities", (msg) => {
		msg.forEach((city) => {
			const option = document.createElement("option");
			option.value = city.city_name;
			option.innerText = city.city_name;
			availableCities.appendChild(option);
		});
	});

	socket.on("data", (msg) => {
		console.log(msg);
		logsArea.value = msg.lines + "\n";
		logsArea.scrollTop = logsArea.scrollHeight;

		if (msg.env.IG_USERNAME.length > 0) {
			document.getElementById("username").value = msg.env.IG_USERNAME;
		}

		if (msg.env.IG_PASSWORD.length > 0) {
			document.getElementById("password").value = msg.env.IG_PASSWORD;
		}

		commentsPosted.innerText = msg.settings.counter;

		saveDataCheckbox.checked = msg.settings.saveData;

		if (msg.env.webshare_token.length > 0) webshare_token_input.value = msg.env.webshare_token;

		proxyToggle.addEventListener("change", () => {
			if (proxyToggle.checked) {
				webshare_token_input.disabled = false;
				document.getElementById("proxies-tab").classList.remove("disabled");
			} else {
				webshare_token_input.disabled = true;
				document.getElementById("proxies-tab").classList.add("disabled");
			}
		});

		if (!msg.settings.proxies_enabled) {
			proxyToggle.checked = false;
			webshare_token_input.disabled = true;
			document.getElementById("proxies-tab").classList.add("disabled");
		} else {
			proxyToggle.checked = true;
			webshare_token_input.disabled = false;
			document.getElementById("proxies-tab").classList.remove("disabled");
		}

        if (msg.proxies) {
            if (msg.proxies.totalProxies) totalProxies.innerText = msg.proxies.totalProxies;

            if (msg.proxies.countries.length > 0) {
                availableCountries.innerHTML = "";

                msg.proxies.countries.forEach((country) => {
                    const option = document.createElement("option");
                    option.value = country.country_code;
                    option.innerText = country.country_code;
                    availableCountries.appendChild(option);
                });
            }
        }


		if (msg.settings.pushover_notifications) {
			pushover_notifications_toggle.checked = true;
			pushover_userKey.disabled = false;
			pushover_appkey.disabled = false;
		} else {
			pushover_notifications_toggle.checked = false;
			pushover_userKey.disabled = true;
			pushover_appkey.disabled = true;
		}

		pushover_notifications_toggle.addEventListener("change", () => {
			if (pushover_notifications_toggle.checked) {
				pushover_userKey.disabled = false;
				pushover_appkey.disabled = false;
			} else {
				pushover_userKey.disabled = true;
				pushover_appkey.disabled = true;
			}
		});

        if (msg.env.pushoverToken.length > 0) pushover_appkey.value = msg.env.pushoverToken;
        if (msg.env.pushoverUser.length > 0) pushover_userKey.value = msg.env.pushoverUser;


		if (msg.settings.botRunning) {
			startButton.disabled = true;
			stopButton.disabled = false;
		} else {
			startButton.disabled = false;
			stopButton.disabled = true;
		}

		if (msg.settings.chromium_headless.length > 0) chromium_headless.value = msg.settings.chromium_headless;
		if (msg.settings.runningOn.length > 0) {
			runningOn.value = msg.settings.runningOn;
			if (msg.settings.runningOn === "Linux") chromium_headless.disabled = true;
		}


		mediaPostLink.value = msg.settings.mediaLink;

        usernames.value = msg.settings.usernames;

		const stopDate = new Date(msg.settings.stopDate);
		const today = new Date();
		const timeDiff = stopDate.getTime() - today.getTime();
		const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
		daysUntilEnd.innerText = daysUntil;

		endDatePicker.valueAsDate = stopDate;

		minDelay.value = msg.settings.commentMinSec;
		maxDelay.value = msg.settings.commentMaxSec;

		if (msg.settings.spamPauseUntil.length > 0 && msg.settings.last429.length > 0) {
			timeSinceError_title.innerText = "Spam detected and 429 error";
		} else if (msg.settings.spamPauseUntil.length > 0) {
			timeSinceError_title.innerText = "Spam detected";
			timeSinceError_body.innerText = msg.settings.spamPauseUntil;
		} else if (msg.settings.last429.length > 0) {
			timeSinceError_title.innerText = "Time since 429 error";

			const last429 = new Date(msg.settings.last429);
			setInterval(() => {
				const today = new Date();
				const timeDiff = today.getTime() - last429.getTime();
				const minutesSince = Math.floor(timeDiff / 1000 / 60);
				const secondsSince = Math.floor(timeDiff / 1000) - minutesSince * 60;
				timeSinceError_body.innerText = `${minutesSince} minutes, and ${secondsSince} seconds.`;
			}, 1000);
		} else {
			timeSinceError_title.innerText = "No errors";
			timeSinceError_body.innerText = "";
		}
	});
}

function setInputEventListeners() {
	const inputs = document.querySelectorAll("input, select");
	inputs.forEach((input) => {
		input.addEventListener("change", (event) => {
			const setting = event.target.dataset.setting;
			let value = event.target.value;

			if (setting === "runningOn" && value === "Linux") {
				chromium_headless.value = "Hidden";
				chromium_headless.disabled = true;
			} else if (setting === "runningOn" && value !== "Linux") {
				chromium_headless.disabled = false;
			}

			if (event.target.type === "checkbox") {
				value = event.target.checked;
			}

			if (setting === "stopDate") {
				const stopDate = new Date(value);
				const today = new Date();
				const timeDiff = stopDate.getTime() - today.getTime();
				const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
				daysUntilEnd.innerText = daysUntil;
			}

			socket.emit("changeSetting", { setting, value });
			console.log(`Setting ${setting} changed to ${value}`);
			showToast("Setting Updated", `Setting ${setting} has been set`);
		});
	});

	availableCountries.addEventListener("change", (event) => {
		const selectedCountry = event.target.value;
		socket.emit("countrySelected", selectedCountry);
		console.log(`Country selected: ${selectedCountry}`);
	});
}

function setButtonEventListeners() {
	startButton.addEventListener("click", () => {
		socket.emit("start");
		startButton.disabled = true;
		stopButton.disabled = false;
	});

	stopButton.addEventListener("click", () => {
		socket.emit("stop");
		startButton.disabled = false;
		stopButton.disabled = true;
	});

	clearLogs_btn.addEventListener("click", () => {
		logsArea.value = "";
	});
}

// Additional Function Definitions

function showToast(title, msg) {
	let toast = {
		title: title,
		message: msg,
		timeout: 5000,
	};
	Toast.setPlacement(TOAST_PLACEMENT.BOTTOM_RIGHT);
	Toast.create(toast);
}
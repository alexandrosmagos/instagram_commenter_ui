const fs = require('fs');

fs.readFile('./settings/cookies.json', 'utf8', (err, data) => {
    if (err) {
        console.log(`Error reading file from disk: ${err}`);
    } else {
        const cookies = JSON.parse(data);

        cookies.forEach((cookie) => {
            let date = new Date(cookie.expires * 1000);

            let hours_Remaining = Math.floor((date - Date.now()) / 1000 / 60 / 60);

            if(!isNaN(date.getTime())) {
                console.log(`Cookie Name: ${cookie.name}, Expires in ${hours_Remaining} hours`);
            } else {
                console.log(`Cookie Name: ${cookie.name}, Expires: Session cookie or invalid expiration`);
            }
        });
    }
});
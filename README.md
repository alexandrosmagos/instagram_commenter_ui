<a name="readme-top"></a>
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<br />
<div align="center">
  <a href="https://github.com/alexandrosmagos/instagram_commenter_ui">
    <img src="readme_images/logo.png" alt="Logo" width="100" height="100">
  </a>

  <h3 align="center">Instagram Giveaway Commenter</h3>

  <p align="center">
    An automated Instagram commenter bot built with Node.js and Puppeteer!
    <br />
    <a href="https://github.com/alexandrosmagos/instagram_commenter_ui">View Demo</a>
    ·
    <a href="https://github.com/alexandrosmagos/instagram_commenter_ui/issues">Report Bug</a>
    ·
    <a href="https://github.com/alexandrosmagos/instagram_commenter_ui/issues">Request Feature</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#disclaimer-amp;-acknowledgement">Disclaimer & Acknowledgement</a></li>
    <li><a href="#credits">Credits</a></li>
  </ol>
</details>

## About The Project

This project aims to provide a simple and customizable bot to automate commenting on Instagram giveaway posts.

## Features

Instagram Giveaway Commenter is a tool that automates the process of participating in Instagram giveaways. Here's an overview of its features:

1. **Automated Commenting**: It automatically posts comments on giveaway posts on Instagram based on the user's settings.

2. **Time Management**: The tool manages comment timings and can delay the next comment based on user-defined minimum and maximum delay values. It avoids spam detection by checking if enough time has passed since the last comment before proceeding with the next one.

3. **Proxy Management**: It allows the use of proxies. The user can enable or disable the proxy usage. In case the proxy is enabled, the tool provides an option to select the desired country and city from a list of available options. **Not Yet Finished**

4. **Error Management**: The tool handles errors such as Instagram's 429 error (too many requests) gracefully, by implementing delays and resuming operation when feasible. It also displays the time elapsed since the last 429 error.

5. **Activity Logs**: The tool maintains logs of its operation which the user can view and clear as needed.

6. **Customization**: The tool allows the user to customize various settings such as Instagram username and password, media link for the giveaway post, stop date for commenting, and pushover notification preferences.

7. **Pushover Notifications**: The tool supports sending notifications to the user's device via Pushover, if the user has enabled this option and provided their Pushover user key and application token.

Remember that this tool is intended for responsible use. Do not use it to spam or violate Instagram's community guidelines.

### Built With

* [Node.js](https://nodejs.org/)
* [Puppeteer](https://pptr.dev/)
* [Socket.IO](https://socket.io/)
* [Express](https://expressjs.com/)
* [dotenv](https://www.npmjs.com/package/dotenv)

## Getting Started

To get a local copy up and running, follow these simple steps:

### Prerequisites

This project requires Node.js and npm. You can install them from the official [Node.js website](https://nodejs.org/).

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/alexandrosmagos/instagram_commenter_ui.git
   
2. Navigate to the project directory
   ```sh
    cd instagram_commenter_ui
   
3. Install the dependencies
   ```sh
    npm install
   
4. Start the application by running 'node server.js' in your terminal

## Usage

After starting the application, you can access the user interface from your web browser by navigating to one of the links printed on the console, or simply `http://localhost:3000`. 

Fill in the required fields such as the Instagram username and password, the URL of the post, the delay range for the comments, and the usernames for the tags, for the giveaway. 

After everything is set, press the "Start" button to start the bot. If there are any missing parameters, the bot stops and mentions what is missing. You can also modify various parameters in the UI to your liking.

## Roadmap

See the [open issues](https://github.com/alexandrosmagos/instagram_commenter_ui/issues) for a list of proposed features (and known issues).

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

To contribute:

1. Fork the Project
2. Create your Feature Branch (git checkout -b feature/AmazingFeature)
3. Commit your Changes (git commit -m 'Add some AmazingFeature')
4. Push to the Branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

## Contact

Alexandros Magos - alexandrosmagos@hotmail.com

Project Link: [https://github.com/alexandrosmagos/instagram_commenter_ui](https://github.com/alexandrosmagos/instagram_commenter_ui)

## License

This project is licensed under the AGPL-3.0 License. For more information, please refer to the [LICENSE](LICENSE) file in the repository.

## Disclaimer & Acknowledgement

This project is intended for educational and research purposes only. It demonstrates the capabilities of automation and how it can be utilized to perform certain tasks. The utilization of this project for automating actions on Instagram is contrary to the Instagram Terms of Service. Consequently, users who decide to use this software application should do so at their own risk. I, as the author, do not endorse or promote the use of this project for purposes that violate Instagram's Terms of Service and cannot be held responsible for any misuse or any potential damages arising from such misuse.

## Credits

This project wouldn't be the same without the fantastic animated background it uses. The initial animation had cubes and was a beautiful addition to the project. The cubes were later changed to Teslas to match the theme of the giveaway, which inspired this project.

The animated background was created by Mohammad Abdul Mohaiman. You can find the original work on [Codepen](https://codepen.io/mohaiman/pen/MQqMyo).

[contributors-shield]: https://img.shields.io/github/contributors/alexandrosmagos/instagram_commenter_ui.svg?style=for-the-badge
[contributors-url]: https://github.com/alexandrosmagos/instagram_commenter_ui/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/alexandrosmagos/instagram_commenter_ui.svg?style=for-the-badge
[forks-url]: https://github.com/alexandrosmagos/instagram_commenter_ui/network/members
[stars-shield]: https://img.shields.io/github/stars/alexandrosmagos/instagram_commenter_ui.svg?style=for-the-badge
[stars-url]: https://github.com/alexandrosmagos/instagram_commenter_ui/stargazers
[issues-shield]: https://img.shields.io/github/issues/alexandrosmagos/instagram_commenter_ui.svg?style=for-the-badge
[issues-url]: https://github.com/alexandrosmagos/instagram_commenter_ui/issues
[license-shield]: https://img.shields.io/github/license/alexandrosmagos/instagram_commenter_ui.svg?style=for-the-badge
[license-url]: https://github.com/alexandrosmagos/instagram_commenter_ui/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/alexandrosmagos
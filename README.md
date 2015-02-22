Poke-War
========

Headless Facebook poke war combatant.

Getting Started
-------

* Clone this repository
```
git clone git@github.com:ScottBouloutian/Poke-War.git
cd Poke-War
npm install
```

* Create a Facebook app
 * Goto [Facebook Dev Page](https://developers.facebook.com/)
 * Apps > Create New App
 * Choose a random title and category (e.g. Operation P.O.K.E. under Entertainment)
 * Note the App ID and App Secret
 * Update ```config.js``` with your App ID and App Secret


* Start the Login server
```
node app
```

* Login to the Facebook app
 * Open a web-browser and navigate to ```localhost:3000```
 * Click the Login link and sign in to Facebook
 * You should be redirected to a page saying 'Success'
 * Copy the Access Token
 * Close the web-browser
 * Close the Login server (ctrl + c)


* Create the secrets file
```
touch secrets.json
```

* Add the following configuration options to ```secrets.json``` :
```
{
    "email": "FACEBOOK_USER_NAME",
    "password": "FACEBOOK_PASSWORD",
    "accessToken": "YOUR_ACCESS_TOKEN"
}
```
* Install [phantomjs](http://phantomjs.org)
* If you've made it this far, do a celebratory dance and start the Poke-War!
```
node index
```

How it Works
-------
This app can be in one of two states. 'Active' mode, or 'Hibernation' mode. The app starts out in hibernation mode. In this mode, Facbook's Graph API is queried by default every 5 minutes to check for any pokes. If one or more pokes are found, the app switches to active mode. In active mode, the app opens a headless browser, logs into your Facebook account, and pokes back everyone who has poked you. Now that the app is in active mode, it check back by default every 15 seconds for new pokes. This continue until eventually no new pokes are found. I plan on adding a configuration option for retrying this active loop a few times even if no new pokes are found.

Notes
-------
The access token is neccessary to generate a request to Facebook's Graph API to check for any existing pokes under your account. To do this, it needs the read_mailbox permission. Your Facebook username and password are needed for the headless browser to sign into Facebook on your behalf. Without this, you would have to manually sign into Facebook everytime the app wanted to poke someone.

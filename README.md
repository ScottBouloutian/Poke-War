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
node login
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

* If you've made it this far, do a celebratory dance and start the Poke-War!
```
node index
```

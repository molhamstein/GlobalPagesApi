var myConfig = require('../server/myConfig.json');
var OneSignal = require('onesignal-node');



var myClient = new OneSignal.Client({
    userAuthKey: myConfig.oneSignalUserAuthKey,
    app: { appAuthKey: myConfig.oneSignalApIKey, appId: myConfig.oneSignalAppId }
});

// myClient

module.exports = myClient;
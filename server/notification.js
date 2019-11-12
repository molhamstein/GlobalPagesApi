var myConfig = require('../server/myConfig.json');
var firbaseJson = require('../server/almersalFirebase.json');
// var FCM = require('fcm-node');
var firebase = require('firebase-admin');
// var OneSignal = require('onesignal-node');
var _ = require('lodash');

// var fcm = new FCM(myConfig.fcmServerKey);
firebase.initializeApp({
  credential: firebase.credential.cert(firbaseJson)
});


console.log("firbaseJson")
console.log(firbaseJson)



var _addAppNotificationToMultiUsers = function (data) {

  app.models.notifications.create(data, function (err, result) {
    if (err)
      console.log("app notification wrong!", err);
  });
}


var _sendNotificationToMultiTokens = function (tokens, message, title, data) {
  var messageObject = {
    // tokens : tokens,

    notification: {
      title: title,
      body: message
    },
  };

  if (data)
    messageObject['data'] = data;

  // fcm.send(messageObject, function(err, response){
  //     if (err)
  //         console.log("notification wrong!",err);
  // });
  firebase.messaging().sendToDevice(tokens, messageObject)
    .then(function (response) {
      console.log("Successfully sent message:", response.results[0]);
    })
    .catch(function (error) {
      console.log("Error sending message:", error);
    });
}



module.exports.addNewVolume = async function (VolumesModel, volume) {

  let ObjectId = VolumesModel.dataSource.ObjectID;
  var title = "عدد جديد من المرسال ";
  var message = "تفقد الإعلانات الجديده في هذا العدد من المرسال";
  var allCategories = [];
  volume.posts.find((err, posts) => {
    _.each(posts, (post) => {


      if (post.categoryId) allCategories.push(post.categoryId);
      if (post.subCategoryId) allCategories.push(post.subCategoryId);
    });

    VolumesModel.getDataSource().connector.collection('user').aggregate([{
        $match: {
          postCategoriesIds: {
            $in: allCategories
          }
        }
      },
      {
        $project: {
          fcmToken: 1,
          postCategoriesIds: 1,
          commonToBoth: {
            $setIntersection: ["$postCategoriesIds", allCategories]
          }
        }
      }

    ], function (err, users) {
      if (err) // TODO Debug
        return console.log(err);
      fcmTokens = [];
      appNotifications = [];
      _.each(users, function (user) {
        if (user.fcmToken)
          fcmTokens.push(user.fcmToken);
        appNotifications.push({
          message: message,
          _type: 'addNewVolume',
          data: {
            volumeId: volume.id
          },
          recipientId: user._id
        });
      });
      _addAppNotificationToMultiUsers(appNotifications);
      //  _sendNotificationToMultiTokens(fcmTokens,message,title,{volumeId : volume.id.toString()});
    });
  });

}

module.exports.sendCustomNotification = function (message, recipients) {
  recipients = _.map(recipients, function (userId) {
    return app.models.user.dataSource.ObjectID(userId);
  });
  app.models.user.find({
    where: {
      id: {
        in: recipients
      }
    }
  }, function (err, users) {
    if (err)
      return console.log(err);

    fcmTokens = [];
    _.each(users, function (user) {
      if (user.fcmToken)
        fcmTokens.push(user.fcmToken);
    });

    var title = "المرسال";
    console.log("fcmTokens")
    console.log(fcmTokens)
    _sendNotificationToMultiTokens(fcmTokens, message, title);
  });
}


module.exports.sendCustomNotificationToAllUsers = function (message) {
  var title = "المرسال";
  var messageObject = {
    // topic : 'allUsers',

    notification: {
      title: title,
      body: message
    }
  };

  // fcm.send(messageObject, function(err, response){
  //     if (err)
  //         console.log("notification wrong!",err);
  // console.log(err,response);
  // });
  firebase.messaging().sendToTopic('allUsers', messageObject)
    .then(function (response) {
      console.log("Successfully sent message:", response);
    })
    .catch(function (error) {
      console.log("Error sending message:", error);
    });
}

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
  console.log("sssssssssss");
  // let ObjectId = VolumesModel.dataSource.ObjectID;
  // var title = "عدد جديد من المرسال ";
  // var message = "تفقد الإعلانات الجديده في هذا العدد من المرسال";
  // var allCategories = [];
  // volume.posts.find((err, posts) => {
  //   _.each(posts, (post) => {


  //     if (post.categoryId) allCategories.push(post.categoryId);
  //     if (post.subCategoryId) allCategories.push(post.subCategoryId);
  //   });

  //   VolumesModel.getDataSource().connector.collection('user').aggregate([{
  //     $match: {
  //       postCategoriesIds: {
  //         $in: allCategories
  //       }
  //     }
  //   },
  //   {
  //     $project: {
  //       fcmToken: 1,
  //       postCategoriesIds: 1,
  //       commonToBoth: {
  //         $setIntersection: ["$postCategoriesIds", allCategories]
  //       }
  //     }
  //   }

  //   ], function (err, users) {
  //     if (err) // TODO Debug
  //       return console.log(err);
  //     fcmTokens = [];
  //     appNotifications = [];
  //     _.each(users, function (user) {
  //       if (user.fcmToken)
  //         fcmTokens.push(user.fcmToken);
  //       appNotifications.push({
  //         message: message,
  //         data: {
  //           volumeId: volume.id
  //         },
  //         recipientId: user._id
  //       });
  //     });
  //     _addAppNotificationToMultiUsers(appNotifications);
  //     _sendNotificationToMultiTokens(fcmTokens, message, title, {
  //       volumeId: volume.id.toString()
  //     });
  //   });
  // });


}

module.exports.sendCustomNotification = function (message, recipients, type, keyId, id) {
  recipients = _.map(recipients, function (userId) {
    return app.models.user.dataSource.ObjectID(userId);
  });
  var data;
  if (keyId != null) {
    data = {}
    data[keyId] = id
  }

  app.models.user.find({
    where: {
      id: {
        in: recipients
      }
    }
  }, function (err, users) {
    if (err)
      return console.log(err);
    appNotifications = []
    fcmTokens = [];
    _.each(users, function (user) {
      if (user.fcmToken)
        fcmTokens.push(user.fcmToken);
      appNotifications.push({
        message: message,
        data: data,
        recipientId: user.id
      });
    });


    var title = "المرسال";
    console.log("fcmTokens")
    console.log(fcmTokens)
    console.log("appNotifications")
    console.log(appNotifications)

    if (type == "app" || type == "both") {
      _addAppNotificationToMultiUsers(appNotifications);
    }
    if (type == "push" || type == "both") {
      _sendNotificationToMultiTokens(fcmTokens, message, title, data);
    }
  });
}


module.exports.sendCustomNotificationToAllUsers = function (message, type, keyId, id) {
  var title = "المرسال";
  var messageObject = {
    // topic : 'allUsers',

    notification: {
      title: title,
      body: message
    }
  };

  var data;
  if (keyId != null) {
    data = {}
    data[keyId] = id
  }


  app.models.user.find({}, function (err, users) {
    if (err)
      return console.log(err);
    appNotifications = []
    _.each(users, function (user) {
      appNotifications.push({
        message: message,
        data: data,
        recipientId: user.id
      });
    });

    if (data)
      messageObject['data'] = data

    if (type == "app" || type == "both") {
      _addAppNotificationToMultiUsers(appNotifications);
    }
    if (type == "push" || type == "both") {
      firebase.messaging().sendToTopic('allUsers', messageObject)
        .then(function (response) {
          console.log("Successfully sent message:", response);
        })
        .catch(function (error) {
          console.log("Error sending message:", error);
        });
    }
  })
}

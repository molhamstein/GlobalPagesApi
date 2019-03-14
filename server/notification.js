var myConfig = require('../server/myConfig.json');
var FCM = require('fcm-node');
// var OneSignal = require('onesignal-node');
var _ = require('lodash')

var serverKey = 'AAAAKVGliig:APA91bHsqHR933i-h3FFKu90LGt2603MnA_nKN4FWITPbPH90vvqMa3c3GjH6GZ6uuagVu4MTDmqNAU8aMN3KUnkavSiGWx0AOHmmZH4DVQvOtFK12SAk_HX3iiGGGQBKm79KwU8W8zD'; //put your server key here
var fcm = new FCM(serverKey);


// var myClient = new OneSignal.Client({
//     userAuthKey: myConfig.oneSignalUserAuthKey,
//     app: { appAuthKey: myConfig.oneSignalApIKey, appId: myConfig.oneSignalAppId }
// });



module.exports.addNewVolume = function (VolumesModel, volume) {
	var allCategories = [];
	_.each(volume.posts(),(post)=>{
		if(post.categoryId) allCategories.push(post.categoryId);
		if(post.subCategoryId) allCategories.push(post.subCategoryId);
	});
	VolumesModel.getDataSource().connector.collection('user').aggregate([
		{ $match: {postCategoriesIds : {$in : allCategories}} },
		{ $project: { postCategoriesIds: 1, commonToBoth: { $setIntersection: [ "$postCategoriesIds", allCategories ] }} }
                     
     ],function(err,users){
     	if(err)  // TODO Debug
     		return console.log(err);
     	_.each(users,function(user){
     		var message = "add new volume  favoriteCategories: "+user.commonToBoth.toString();
     		_sendNotification(user._id,message,"addNewVolume")
     	});
     })
}

module.exports.sendCustomNotification = function (message,recipients) {
	return _sendNotificationToMultiUsers(recipients,message,'customNotification');
}






var _sendNotificationToMultiUsers = function(usersIds,message,_type){
	_.each(usersIds,(user)=>{_sendNotification(user._id || user,message,_type)});
}


var _sendNotification = function(userId,message,_type= 'none'){
	app.models.user.findById(userId,function(err,user){
		if(err || !user) 
			return console.log(err);

		_sendOneSignalNotification(user.fcmToken,message,_type);

		app.models.notifications.create({
			message : message,
			recipientId : userId,
			_type : _type
		},function(err,notification){
			if(err)
				return console.log(err);
			console.log(userId, message)
		});
	});
}

var _sendOneSignalNotification = function(fcmToken,message,_type){
	console.log(fcmToken,message);
	var messageObject = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: fcmToken,
        
        notification: {
            title: _type, 
            body: message
        },
        
        data: {  //you can send only notification or only data(or include both)
            businessId: '123456789',
            adId: '123456789'
        }
    };
    
    fcm.send(messageObject, function(err, response){
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });

	// var firstNotification = new OneSignal.Notification({    
 //    	contents: {    
	//         en: message
	//     }
	// });    
	// firstNotification.postBody["filters"] = [{field: "tag", key: "user_id", relation: "=", value: userId}]; 
	// firstNotification.postBody["data"] = {"abc": "123", "foo": "bar"};  
	// firstNotification.postBody["included_segments"] = ["Active Users"];    
	// myClient.sendNotification(firstNotification, function (err, httpResponse,data) {    
	// 	if (err) {    
	// 	    console.log('Something went wrong...');    
	// 	} else {    
	// 	    console.log(data, httpResponse.statusCode);    
	// 	}    
	// });   
}
var myConfig = require('../server/myConfig.json');
var FCM = require('fcm-node');
// var OneSignal = require('onesignal-node');
var _ = require('lodash')

var fcm = new FCM(myConfig.fcmServerKey);


module.exports.addNewVolume = function (VolumesModel, volume) {
 	var title ="عدد جديد من المرسال ";
	var message = "تفقد الإعلانات الجديده في هذا العدد من المرسال";
	
    var allCategories = [];
	_.each(volume.posts(),(post)=>{
		if(post.categoryId) allCategories.push(post.categoryId);
		if(post.subCategoryId) allCategories.push(post.subCategoryId);
	});
	VolumesModel.getDataSource().connector.collection('user').aggregate([
		{ $match: {postCategoriesIds : {$in : allCategories}} },
		{ $project: { fcmToken:1, postCategoriesIds: 1, commonToBoth: { $setIntersection: [ "$postCategoriesIds", allCategories ] }} }
                     
     ],function(err,users){
     	if(err)  // TODO Debug
     		return console.log(err);
        fcmTokens = [];
     	appNotifications = [];
     	_.each(users,function(user){
     		if(user.fcmToken)
     			fcmTokens.push(user.fcmToken);
            appNotifications.push({
                message : message,
                _type : 'addNewVolume',
                data : {volumeId : volume.id},
                recipientId : user._id
            });
     	});
        _addAppNotificationToMultiUsers(appNotifications);
 		_sendNotificationToMultiTokens(fcmTokens,message,title,{volumeId : volume.id});
    });
}

module.exports.sendCustomNotification = function (message,recipients) {
	recipients = _.map(recipients,function(userId){
		return app.models.user.dataSource.ObjectID(userId);
	});
	app.models.user.find({where:{id : {in : recipients}}},function(err,users){
		if(err)
			return console.log(err);

		fcmTokens = [];
     	_.each(users,function(user){
     		if(user.fcmToken)
     			fcmTokens.push(user.fcmToken);
     	});

     	var title = "المرسال";
 		_sendNotificationToMultiTokens(fcmTokens,message,title);
	});
}


module.exports.sendCustomNotificationToAllUsers = function (message) {
 	var title = "المرسال";
	var messageObject = { 
        topic : 'allUsers',
        
        notification: {
            title: title, 
            body: message
        }
    };
    
    fcm.send(messageObject, function(err, response){
        if (err)
            console.log("notification wrong!",err);
    });
}



_sendNotificationToMultiTokens = function(tokens, message, title, data){
	var messageObject = { 
        tokens : tokens,
        
        notification: {
            title: title, 
            body: message
        },
    };

    if(data)
    	messageObject['data'] = data;
    
    fcm.send(messageObject, function(err, response){
        if (err)
            console.log("notification wrong!",err);
    });
}



_addAppNotificationToMultiUsers = function(data){
    app.models.notifications.create(data,function(err,result){
        if(err)
            console.log("app notification wrong!",err);
    });
}
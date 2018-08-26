var myConfig = require('../server/myConfig.json');
var OneSignal = require('onesignal-node');
var _ = require('lodash')



var myClient = new OneSignal.Client({
    userAuthKey: myConfig.oneSignalUserAuthKey,
    app: { appAuthKey: myConfig.oneSignalApIKey, appId: myConfig.oneSignalAppId }
});



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

	app.models.notifications.create({
		message : message,
		recipientId : userId,
		_type : _type
	},function(err,notification){
		if(err)
			return console.log(err);
		console.log(userId, message)
	})
}
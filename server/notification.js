var myConfig = require('../server/myConfig.json');
var OneSignal = require('onesignal-node');
var _ = require('lodash')



var myClient = new OneSignal.Client({
    userAuthKey: myConfig.oneSignalUserAuthKey,
    app: { appAuthKey: myConfig.oneSignalApIKey, appId: myConfig.oneSignalAppId }
});

// myClient


module.exports.addNewVolume = function (VolumesModel, volume) {
	var allCategories = [];
	_.each(volume.posts(),(post)=>{
		if(post.categoryId) allCategories.push(post.categoryId);
		if(post.subCategoryId) allCategories.push(post.subCategoryId);
	})
	VolumesModel.getDataSource().connector.collection('user').aggregate([
		{ $match: {postCategoriesIds : {$in : allCategories}} },
		{ $project: { postCategoriesIds: 1, commonToBoth: { $setIntersection: [ "$postCategoriesIds", allCategories ] }} }
                     
     ],function(err,users){
     	if(err)  // TODO Debug
     		return console.log(err);
     	_.each(users,function(user){
     		console.log(user)
     		_sendNotification(user._id)
     	});
     })
}


var sendNotificationToMultiUsers = function(usersIds,message){
	_.each(usersIds,(userId)=>{_sendNotification(userId,message)});
}

var _sendNotification = function(userId,message){
	console.log(userId,message);
	// myClient.
}

// module.exports = myClient;
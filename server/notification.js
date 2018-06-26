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
		{ $project: { postCategoriesIds: 1, commonToBoth: { $setIntersection: [ "$postCategoriesIds", allCategories ] }, _id: 0 } }
                     
     ],function(err,users){
		console.log(err,users);
     })
}

// module.exports = myClient;
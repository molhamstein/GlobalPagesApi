'use strict';
var notificationModule = require('../notification')
module.exports = function(Notifications) {

	Notifications.customNotifcation = function(notification,recipients,cb){
		notificationModule.sendCustomNotification(notification,recipients);
		return cb();
	}
	
	Notifications.remoteMethod('customNotifcation', {
    	description: 'get only notifications by tokenId ',
		accepts: [
			{arg: 'notification', type: 'string', 'http': {source: 'form'}},
			{arg: 'recipients', type: 'array', 'http': {source: 'form'}}
		],
		returns: {arg: 'body', type: 'body',root: true},
		http: {verb: 'post',path: '/customNotifcation'},
    });

	Notifications.me = function(req,seen,cb){

		if(!req.accessToken || !req.accessToken.userId){
			var err1 = new Error('User not login');
	        err1.statusCode = 403;
	        err1.code = 'USER_NOT_LOGIN';
			return cb(err1)
		}
		var where  = {recipientId : req.accessToken.userId}
		if(seen != undefined)
			where.seen = seen

		Notifications.find({where : where}, function(err, notifications) {
			if(err) 
				return cb(err);
			where.seen = false;
			Notifications.updateAll(where,{seen : true},function(err,result){
				if(err)
					return cb(err);
				return cb(null,notifications)
			});
		});
	}
	Notifications.remoteMethod('me', {
    	description: 'get only notifications by tokenId ',
		accepts: [
			{arg: 'req', type: 'object', 'http': {source: 'req'}},
			{arg: 'seen', type: 'boolean', 'http': {source: 'query'}}
		],
		returns: {arg: 'body', type: 'body',root: true},
		http: {verb: 'get',path: '/me'},
    });
};

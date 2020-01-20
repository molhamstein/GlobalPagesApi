'use strict';
var notificationModule = require('../notification')
var _ = require('lodash')
module.exports = function (Notifications) {

  Notifications.customNotifcation = function (message, recipients, type = "push", data, cb) {
    let keyId = null
    let id = null
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        id = data[key];
        keyId = key
      }
    }

    if (!recipients || recipients.length == 0)
      notificationModule.sendCustomNotificationToAllUsers(message, type, keyId, id);
    else
      notificationModule.sendCustomNotification(message, recipients, type, keyId, id);
    // }

    // }

    return cb(null, {
      message: 'Done'
    });
  }

  Notifications.remoteMethod('customNotifcation', {
    description: 'get only notifications by tokenId ',
    accepts: [{
        arg: 'message',
        type: 'string',
        'http': {
          source: 'form'
        }
      },
      {
        arg: 'recipients',
        type: 'array',
        'http': {
          source: 'form'
        }
      },
      {
        arg: 'type',
        type: 'string',
        'http': {
          source: 'form'
        }
      },
      {
        arg: 'data',
        type: 'object',
        'http': {
          source: 'form'
        }
      }
    ],
    returns: {
      arg: 'body',
      type: 'body',
      root: true
    },
    http: {
      verb: 'post',
      path: '/customNotifcation'
    },
  });

  Notifications.me = function (req, seen, cb) {

    if (!req.accessToken || !req.accessToken.userId) {
      var err1 = new Error('User not login');
      err1.statusCode = 403;
      err1.code = 'USER_NOT_LOGIN';
      return cb(err1)
    }
    var where = {
      recipientId: req.accessToken.userId
    }
    if (seen != undefined)
      where.seen = seen

    Notifications.find({
      where: where
    }, function (err, notifications) {
      if (err)
        return cb(err);
      // where.seen = false;
      // Notifications.updateAll(where,{seen : true},function(err,result){
      // 	if(err)
      // 		return cb(err);
      return cb(null, notifications)
      // });
    });
  }
  Notifications.remoteMethod('me', {
    description: 'get only notifications by tokenId ',
    accepts: [{
        arg: 'req',
        type: 'object',
        'http': {
          source: 'req'
        }
      },
      {
        arg: 'seen',
        type: 'boolean',
        'http': {
          source: 'query'
        }
      }
    ],
    returns: {
      arg: 'body',
      type: 'body',
      root: true
    },
    http: {
      verb: 'get',
      path: '/me'
    },
  });

  Notifications.seenNotification = async function (req, notifications) {
    if (!req.accessToken || !req.accessToken.userId) {
      var err1 = new Error('User not login');
      err1.statusCode = 403;
      err1.code = 'USER_NOT_LOGIN';
      throw err1;
    }
    //_.each(notifications, function (id, index) { 
    //	try { notifications[index] = Notifications.dataSource.ObjectID(id) } catch (err) { } });

    notifications = notifications.map(notification => Notifications.dataSource.ObjectID(notification));
    var where = {
      recipientId: req.accessToken.userId,
      seen: false,
      _id: {
        in: notifications
      }
    };
    return await Notifications.updateAll(where, {
      seen: true
    });

  }
  Notifications.remoteMethod('seenNotification', {
    description: 'change my multi notifications to seen ',
    accepts: [{
        arg: 'req',
        type: 'object',
        'http': {
          source: 'req'
        }
      },
      {
        arg: 'notifications',
        type: 'array'
      }
    ],
    returns: {
      arg: 'body',
      type: 'body',
      root: true
    },
    http: {
      verb: 'post',
      path: '/seenNotification'
    },
  });


  Notifications.clear = async function (req) {

    if (!req.accessToken || !req.accessToken.userId) {
      var err1 = new Error('User not login');
      err1.statusCode = 403;
      err1.code = 'USER_NOT_LOGIN';
      throw err1;
    }

    let userId = req.accessToken.userId;

    return Notifications.app.models.notifications.destroyAll({
      recipientId: userId
    });
  }
  Notifications.remoteMethod('clear', {
    description: 'clear user notifications ',
    accepts: [{
      arg: 'req',
      type: 'object',
      'http': {
        source: 'req'
      }
    }, ],
    returns: {
      arg: 'body',
      type: 'body',
      root: true
    },
    http: {
      verb: 'put',
      path: '/clear'
    },
  });


};

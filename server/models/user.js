'use strict';
var myConfig = require('../../server/myConfig.json');
var path = require('path');
var async = require('async');
var crypto = require('crypto');
var ejs = require('ejs');
var versionObject = require("../boot/version.json");
var g = require('strong-globalize')();
var debug = require('debug')('loopback:user');


module.exports = function (User) {
  // validation
  //	User.validatesInclusionOf('gender', {in: ['male', 'female']});
  User.validatesInclusionOf('status', {
    in: ['pending', 'activated', 'deactivated']
  });

  User.settings.acls = [{
    "principalType": "ROLE",
    "principalId": "$everyone",
    "permission": "ALLOW"
  }];

  User.isAdmin = function (accessToken, option, cb) {
    if (typeof cb != 'function') {
      cb = option;
      option = {};
    }
    if (!accessToken || !accessToken.userId)
      return cb(ERROR(401, 'authentication required'), false);
    User.findById(accessToken.userId, function (err, user) {
      if (err)
        return cb(err);
      if (!user || !user.roles.length)
        return cb(null, false);
      var isAdmin = _.some(user.roles(), ['name', 'admin']);
      // if(isAdmin || (!option && !option.getCampaignIds && !option.getAdsIds))
      return cb(null, isAdmin);
    });
  }


  User.beforeRemote('create', function (ctx, modelInstance, next) {
    var name = ctx.req.body.email.trim().match(/^([^@]*)@/)[1];

    // make unique name
    User.count({
      username: {
        like: RegExp('^' + name + '[0-9]*')
      }
    }, function (err, count) {
      if (err)
        return next(err);

      ctx.req.body.username = name;
      if (count != 0)
        ctx.req.body.username = name + (count.toString());
      ctx.req.body.email = ctx.req.body.email.toLowerCase();

      next();
    });
  });

  //send verification email after registration
  User.afterRemote('create', function (context, user, next) {
    User.app.models.notifications.create({ "message": "مرحباً في تطبيق المرسال , من أجل الإعلان أو التسجيل في الموقع يرجى التواصل على info@almersal.co", "recipientId": user.id, "type": "welcome" })
    var options = {
      type: 'email',
      to: user.email,
      from: myConfig.email,
      subject: 'Thanks for registering.',
      template: path.resolve(__dirname, '../../server/views/emails/verifyEmail.ejs'),
      // redirect: '/verified',
      user: user,
      host: 'almersal.co',
      port: 80
    };
    user.verify(options, function (err, response) {
      if (err) {
        User.deleteById(user.id);
        return next(err);
      }
      context.res.json(user)
    });
  });

  User.forgotPassword = function (email, cb) {
    var EmailModel = User.app.models.Email;
    User.findOne({
      where: {
        email: email
      }
    }, function (err, user) {
      if (err)
        return cb(err);
      if (!user) {
        console.log(email);
        err = new Error('Email not found');
        err.statusCode = 404;
        err.code = 'EMAIL_NOT_FOUND';
        return cb(err);
      }
      async.waterfall([
        function (done) {
          crypto.randomBytes(20, function (err, buf) {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        function (token, done) {
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + myConfig.resetPasswordExpires; // 1 hour

          user.save(function (err) {
            done(err, token, user);
          });
        },
        function (token, user, done) {
          var url = 'http://' + myConfig.host + '/api/User/resetPassword/' + token;
          ejs.renderFile(path.resolve(__dirname, '../../server/views/emails/resetPasswordEmail.ejs'), {
            url: url
          }, {}, function (err, template) {
            if (err)
              return done(err);
            var options = {
              to: user.email,
              from: myConfig.email,
              subject: 'Password Reset',
              html: template
            };
            // send Email
            EmailModel.send(options, done);
          });
        }
      ], function (err) {
        if (err) return cb(err);
        return cb(null, "done")
        // res.redirect('/forgot');
      });
    });
  }

  User.remoteMethod('forgotPassword', {
    description: 'forgot password for a user with email.',
    accepts: {
      arg: 'email',
      type: 'string',
      required: true,
      http: {
        source: 'form'
      }
    },
    returns: {
      arg: 'message',
      type: 'string'
    },
    http: {
      verb: 'post'
    },
  });

  User.getResetPassword = function (token, res, cb) {
    User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: Date.now()
        }
      }
    }, function (err, user) {
      if (err)
        return cb(err);
      if (!user) {
        err = new Error('Password reset token is invalid or has expired');
        err.statusCode = 404;
        // err.code = 'TOKEN_INVALID';
        return cb(err);
      }
      return res.render(path.resolve(__dirname, '../../server/views/resetPasswordForm.ejs'), {
        user: user
      })
    });
  };

  User.remoteMethod('getResetPassword', {
    accepts: [{
      arg: 'token',
      type: 'string',
      required: true
    },
    {
      arg: 'res',
      type: 'object',
      http: {
        source: 'res'
      }
    },
    ],
    http: {
      verb: 'get',
      path: '/resetPassword/:token'
    },
  });


  User.checkVersion = function (version, platform, callback) {
    var result = ""
    if (platform == "android")
      result = User.compirVersion(version, versionObject['android'])
    else
      result = User.compirVersion(version, versionObject['ios'])
    var versionResult = {
      "status": result
    }
    if (result == 'obsolete' || result == 'update available') {
      versionResult["link"] = versionObject[platform].Link;
    }
    callback(null, versionResult)
  }
  User.compirVersion = function (userVersion, version) {

    var isAfterLoadVersion = false
    var isBeforLastVersion = false
    var arrayUserVersion = userVersion.toString().split('.');
    var arrayLastVersion = version.lastVersion.toString().split('.');
    var arrayLoadVersion = version.loadVersion.toString().split('.');
    console.log(arrayUserVersion)
    console.log(arrayLastVersion)
    console.log(arrayLoadVersion)
    if (arrayUserVersion[2] == undefined)
      arrayUserVersion[2] = 0
    for (let index = 0; index < arrayUserVersion.length; index++) {
      const element = parseInt(arrayUserVersion[index]);
      const elementLoadVersion = parseInt(arrayLoadVersion[index]);
      if (element > elementLoadVersion) {
        isAfterLoadVersion = true
        break;
      }
      if (element < elementLoadVersion) {
        isAfterLoadVersion = false
        break;
      }
    }
    if (isAfterLoadVersion == false) {
      return ("obsolete")
    }

    for (let index = 0; index < arrayUserVersion.length; index++) {
      const element = parseInt(arrayUserVersion[index]);
      const elementLastVersion = parseInt(arrayLastVersion[index]);
      if (element < elementLastVersion) {
        isBeforLastVersion = true
        break;
      }
      if (element > elementLastVersion) {
        isBeforLastVersion = false
        break;
      }
    }


    if (isBeforLastVersion == true) {
      return ("update available")
    } else {
      if (userVersion == version.reviewVersion)
        return ("inreview")
      else
        return ("uptodate")
    }
  }

  User.remoteMethod('checkVersion', {
    accepts: [{
      arg: 'version',
      type: 'string',
      required: true
    },
    {
      arg: 'platform',
      type: 'string',
      required: true
    }
    ],
    returns: [{
      "arg": "object",
      "type": "object",
      "root": true,
      "description": ""
    }],
    http: {
      verb: 'get',
      path: '/checkVersion'
    },
  });



  User.getSimilerCV = async function (userId, req, callback) {
    var oneCV = await User.app.models.userCV.findOne({
      "where": {
        "userId": userId
      }
    })
    var tags = []
    if (oneCV == null)
      callback(null, [])
    oneCV.tags().forEach(element => {
      tags.push(element.id);
    });
    if (tags.length == 0)
      callback(null, [])
    var allUserTags = await User.app.models.userTags.find({
      "where": {
        "tagId": {
          "inq": tags
        },
        "userCvId": {
          "neq": oneCV.id
        }
      }
    })

    var arrayAllUserTags = {}
    allUserTags.forEach(element => {
      if (arrayAllUserTags[element.userCvId.toString()] == null) {
        arrayAllUserTags[element.userCvId.toString()] = 0
      }
      arrayAllUserTags[element.userCvId.toString()] += 1
    });

    var arrayAllUserTagsSorted = Object.keys(arrayAllUserTags).sort(function (a, b) {
      return arrayAllUserTags[b] - arrayAllUserTags[a]
    })

    var cvs = await User.app.models.userCV.find({
      "where": {
        "id": {
          "inq": arrayAllUserTagsSorted
        }
      }
    })

    var usersID = []
    cvs.forEach(element => {
      usersID.push(element.userId)
    });

    var users = await User.find({
      "where": {
        "id": {
          "inq": usersID
        }
      },
      "include": "CV"
    })

    var usersSorted = new Array(users.length);

    users.forEach(element => {
      var cvId = element.CV().id;
      console.log(cvId)
      console.log(arrayAllUserTagsSorted)
      var index = getIndexInArray(cvId, arrayAllUserTagsSorted)
      usersSorted[index] = element
    });
    callback(null, usersSorted)


  }

  function getIndexInArray(id, array) {
    var mainIndex = -1;
    // array.forEach(element => {
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      if (element.toString() == id.toString()) {
        return index
      }
    }
    return mainIndex;
  }

  User.remoteMethod('getSimilerCV', {
    description: 'get similer cv',
    accepts: [{
      "arg": "userId",
      "type": "string",
      "required": true,
      "description": "",
      "http": {
        "source": "path"
      }
    },
    {
      "arg": "req",
      "type": "object",
      "required": true,
      "description": "",
      "http": {
        "source": "req"
      }
    }
    ],
    returns: {
      arg: 'message',
      root: true,
      type: 'object'
    },
    http: {
      verb: 'get',
      path: '/:userId/getSimilerCV'
    },
  });


  User.resetPassword = function (token, newPassword, res, cb) {
    User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: Date.now()
        }
      }
    }, function (err, user) {
      if (err)
        return cb(err);
      if (!user) {
        err = new Error('Password reset token is invalid or has expired');
        err.statusCode = 404;
        err.code = 'TOKEN_INVALID';
        return cb(err);
      }
      user.setPassword(newPassword, (err) => {
        if (err)
          return cb(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.save((err) => {
          if (err)
            return cb(err);
          return res.redirect('/');
          // return cb(null,"Success! Your password has been changed")
        })
      });
    });
  };

  User.remoteMethod('resetPassword', {
    accepts: [{
      arg: 'token',
      type: 'string',
      required: true
    },
    {
      arg: 'newPassword',
      type: 'string',
      required: true,
      http: {
        source: 'form'
      }
    },
    {
      arg: 'res',
      type: 'object',
      http: {
        source: 'res'
      }
    },
    ],
    returns: {
      arg: 'message',
      type: 'any'
    },
    http: {
      verb: 'post',
      path: '/resetPassword/:token'
    },
  });

  // agree or reject user
  User.changeStatus = function (userId, status, cb) {
    User.findById(userId.toString(), function (err, user) {
      if (err)
        return cb(err);
      if (!user) {
        err = new Error('User not found');
        err.statusCode = 404;
        err.code = 'USER_NOT_FOUND';
        return cb(err);
      }
      // console.log("BBBBBB")
      user.status = (status) ? 'activated' : 'deactivated';
      user.save((err) => {
        if (err)
          return cb(err)
        return cb(null, user.status);
      })
    });
  }

  User.remoteMethod('changeStatus', {
    description: 'agree or Reject User from admin',
    accepts: [{
      arg: 'userId',
      type: 'string',
      required: true
    },
    {
      arg: 'agree',
      type: 'boolean',
      required: true,
      http: {
        source: 'form'
      }
    },
    ],
    returns: {
      arg: 'message',
      type: 'string'
    },
    http: {
      verb: 'post',
      path: '/:userId/changeStatus'
    },
  });

  User.updateFcmToken = function (token, options, res, cb) {
    if (!options.accessToken || !options.accessToken.userId)
      return cb(ERROR(401, 'authentication required'), false);
    User.findById(options.accessToken.userId, function (err, user) {
      if (err)
        return cb(err);
      user.fcmToken = token;
      user.save(function (err) {
        if (err)
          return cb(err);
        res.status(202).json({
          message: 'updatedSuccessfully'
        });
      })
    });
  };

  User.remoteMethod('updateFcmToken', {
    accepts: [{
      arg: 'token',
      type: 'string',
      required: true
    },
    {
      arg: "options",
      type: "object",
      http: "optionsFromRequest"
    },
    {
      arg: 'res',
      type: 'object',
      http: {
        source: 'res'
      }
    },
    ],
    http: {
      verb: 'post',
      path: '/fcmToken'
    },
  });

  User.changePassword = async function (userId, password) {
    /* Todo permisions */
    let user = await User.findById(userId);
    if (!user)
      throw ERROR(404, "User not found");

    await user.updateAttribute('password', User.hashPassword(password));


  }


  User.remoteMethod('changePassword', {
    description: 'Change user password from admin',
    accepts: [{
      arg: 'userId',
      type: 'string',
      required: true
    },
    {
      arg: 'password',
      type: 'string',
      required: true
    },
    ],
    returns: {
      arg: 'message',
      type: 'string'
    },
    http: {
      verb: 'put',
      path: '/:userId/changePassword'
    },
  });

  User.login = function (credentials, include, fn) {
    var self = this;
    if (typeof include === 'function') {
      fn = include;
      include = undefined;
    }

    fn = fn || utils.createPromiseCallback();

    include = (include || '');
    if (Array.isArray(include)) {
      include = include.map(function (val) {
        return val.toLowerCase();
      });
    } else {
      include = include.toLowerCase();
    }


    var query = {
      email: credentials.email
    }

    if (!query.email) {
      var err2 = new Error(g.f('{{email}} is required'));
      err2.statusCode = 400;
      err2.code = 'EMAIL_REQUIRED';
      fn(err2);
      return fn.promise;
    }

    self.findOne({
      where: query
    }, function (err, user) {
      var defaultError = new Error(g.f('login failed'));
      defaultError.statusCode = 401;
      defaultError.code = 'LOGIN_FAILED';

      function tokenHandler(err, token) {
        if (err) return fn(err);
        if (Array.isArray(include) ? include.indexOf('user') !== -1 : include === 'user') {
          // NOTE(bajtos) We can't set token.user here:
          //  1. token.user already exists, it's a function injected by
          //     "AccessToken belongsTo User" relation
          //  2. ModelBaseClass.toJSON() ignores own properties, thus
          //     the value won't be included in the HTTP response
          // See also loopback#161 and loopback#162
          token.__data.user = user;
        }
        fn(err, token);
      }

      if (err) {
        debug('An error is reported from User.findOne: %j', err);
        fn(defaultError);
      } else if (user) {
        if (user.dateUnlockAccount && user.dateUnlockAccount.getTime() > new Date().getTime()) {
          var lockError = new Error(g.f('your account is lock'));
          lockError.statusCode = 530;
          lockError.code = 'ACCOUNT_IS_LOCK';
          fn(lockError);

        }
        else {
          user.hasPassword(credentials.password, function (err, isMatch) {
            if (err) {
              debug('An error is reported from User.hasPassword: %j', err);
              fn(defaultError);
            } else if (isMatch) {
              user.updateAttribute("failedLogin", 0, function () {

                if (user.createAccessToken.length === 2) {
                  user.createAccessToken(credentials.ttl, tokenHandler);
                } else {
                  user.createAccessToken(credentials.ttl, credentials, tokenHandler);
                }
              })
            } else {
              let newFailedLogin = user.failedLogin + 1
              let data = { "failedLogin": newFailedLogin }
              if (newFailedLogin % 3 == 0) {
                let date = new Date()
                data['dateUnlockAccount'] = date.setHours(date.getHours() + 1)
              }
              user.updateAttributes(data, function () {
                debug('The password is invalid for user %s', query.email || query.username);
                fn(defaultError);
              })
            }
          });
        }
      } else {
        debug('No matching record is found for user %s', query.email || query.username);
        fn(defaultError);
      }
    });
    return fn.promise;
  }

  User.afterRemote("login", function (ctx, res, next) {

    let temp = {
      ...res.__data
    };
    User.findById(res.userId, (err, user) => {
      ctx.result = temp;
      temp.user = user;
      next();
    });

  });



  User.socialLogin = async function (data, type, callback) {
    try {

      var socialId = data.socialId;
      var gender = data.gender;
      var image = data.image;
      var email = data.email;
      var username = data.username;
      var isNewUser = false;
      let user = await User.findOne({ "where": { "socialId": socialId, "typeLogIn": type } })
      if (user == null) {
        isNewUser = true;
        var pattern = new RegExp('.*' + username + '.*', "i");
        let usernameCount = await User.count({ "username": { regexp: pattern.toString() } })
        if (usernameCount != 0) {
          username += "_" + usernameCount
        }
        image = await User.app.service.downloadImage(image);
        user = await User.create({ "socialId": socialId, "typeLogIn": type, "gender": gender, "imageProfile": image, "email": email, "status": "activated", "username": username, "password": "000000" })
      }
      let newToken = await User.app.models.AccessToken.create({
        "userId": user.id, "ttl": 31536000000
      })
      let loginData = await User.app.models.AccessToken.findOne({
        include: {
          relation: 'user'
        },
        where: {
          userId: user.id,
          id: newToken.id
        }
      })
      var temp = loginData.__data
      user['isNewUser'] = isNewUser
      temp['user'] = user
      if (isNewUser) {
        User.app.models.Notifications.customNotifcation("في حال رغبتكم بالاعلان معنا الرجاء التواصل ...", [user.id], 'app', {}, function () { })
      }
      callback(null, temp)
    }
    catch (error) {
      callback(error)
    }
  }
  User.remoteMethod('socialLogin', {
    description: 'social Login',
    accepts: [
      {
        "arg": "data",
        "type": "object",
        "required": true,
        "description": ""
      },
      {
        "arg": "type",
        "type": "string",
        "required": true,
        "description": ""
      }
    ],
    returns: {
      "arg": "result",
      "type": "object",
      "root": true,
      "description": ""
    },
    http: {
      verb: 'post',
      path: '/socialLogin'
    },
  });

  function getRegisteredReport(filter, callback) {
    User.getDataSource().connector.connect(function (err, db) {

      var collection = db.collection('user');
      var cursor = collection.aggregate([{
        $match: filter
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$creationDate"
            },
            day: {
              $dayOfMonth: "$creationDate"
            },
            year: {
              $year: "$creationDate"
            }
          },
          total: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: "$total",
        }
      }
      ]);
      cursor.get(function (err, data) {
        if (err) return callback(err);
        return callback(null, data);
      })
    });
  }


  User.timeStateReport = function (from, to, callback) {
    var filter = {}
    if (from) {
      filter['creationDate'] = {
        '$gt': new Date(from)
      }
    }
    if (to) {
      if (filter['creationDate'] == null)
        filter['creationDate'] = {}
      filter['creationDate']['$lt'] = new Date(to)
    }


    var resultData = []
    getRegisteredReport(filter, function (err, firstData) {
      resultData[0] = firstData;
      // getSecondReport(filter, country, function (err, secondetData) {
      //   resultData[1] = secondetData;
      //   getThierdReport(filter, country, function (err, thierdData) {
      //     resultData[2] = thierdData;
      callback(null, resultData)
      //   })
      // })

    });
  };

  User.remoteMethod('timeStateReport', {
    description: 'social Login',
    accepts: [
      {
        "arg": "from",
        "type": "date",
        "required": false,
        "description": ""
      },
      {
        "arg": "to",
        "type": "date",
        "required": false,
        "description": ""
      },
    ],
    returns: {
      "arg": "result",
      "type": "object",
      "root": true,
      "description": ""
    },
    http: {
      verb: 'get',
      path: '/timeStateReport'
    },
  });


  User.setLoginType = async function (callback) {
    try {
      await User.updateAll({}, { "typeLogIn": "registration" })
      callback()
    }
    catch (error) {
      callback(error)
    }
  }
  User.remoteMethod('setLoginType', {
    description: 'social Login',
    accepts: [
    ],
    returns: {
      "arg": "result",
      "type": "object",
      "root": true,
      "description": ""
    },
    http: {
      verb: 'get',
      path: '/setLoginType'
    },
  });



  User.timeStateReport = function (from, to, cb) {
    var filter = {}
    if (from) {
      filter['creationDate'] = {
        '$gt': new Date(from)
      }
    }
    if (to) {
      if (filter['creationDate'] == null)
        filter['creationDate'] = {}
      filter['creationDate']['$lt'] = new Date(to)
    }

    var resultData = []
    getUserReport(filter, function (err, userData) {
      resultData[0] = userData;
      getBusinessReport(filter, function (err, businessData) {
        resultData[1] = businessData;
        getPostReport(filter, function (err, postData) {
          resultData[2] = postData;
          getJobReport(filter, function (err, jobData) {
            resultData[3] = jobData;
            cb(null, resultData)
          })

        })
      })

    })

  }

  function getUserReport(filter, callback) {

    User.getDataSource().connector.connect(function (err, db) {

      var collection = db.collection('user');
      var cursor = collection.aggregate([{
        $match: filter
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$creationDate"
            },
            day: {
              $dayOfMonth: "$creationDate"
            },
            year: {
              $year: "$creationDate"
            }
          },
          total: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: "$total",
        }
      }
      ]);
      cursor.get(function (err, data) {
        if (err) return callback(err);
        return callback(null, data);
      })
    });
  }
  function getJobReport(filter, callback) {

    User.getDataSource().connector.connect(function (err, db) {

      var collection = db.collection('jobOpportunities');
      var cursor = collection.aggregate([{
        $match: filter
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$creationDate"
            },
            day: {
              $dayOfMonth: "$creationDate"
            },
            year: {
              $year: "$creationDate"
            }
          },
          total: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: "$total",
        }
      }
      ]);
      cursor.get(function (err, data) {
        if (err) return callback(err);
        return callback(null, data);
      })
    });
  }

  function getPostReport(filter, callback) {

    User.getDataSource().connector.connect(function (err, db) {

      var collection = db.collection('posts');
      var cursor = collection.aggregate([{
        $match: filter
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$creationDate"
            },
            day: {
              $dayOfMonth: "$creationDate"
            },
            year: {
              $year: "$creationDate"
            }
          },
          total: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: "$total",
        }
      }
      ]);
      cursor.get(function (err, data) {
        if (err) return callback(err);
        return callback(null, data);
      })
    });
  }

  function getBusinessReport(filter, callback) {

    User.getDataSource().connector.connect(function (err, db) {

      var collection = db.collection('business');
      var cursor = collection.aggregate([{
        $match: filter
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$creationDate"
            },
            day: {
              $dayOfMonth: "$creationDate"
            },
            year: {
              $year: "$creationDate"
            }
          },
          total: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: "$total",
        }
      }
      ]);
      cursor.get(function (err, data) {
        if (err) return callback(err);
        return callback(null, data);
      })
    });
  }

  User.remoteMethod('timeStateReport', {
    "accepts": [
      {
        "arg": "from",
        "type": "date",
        "required": false,
        "description": ""
      },
      {
        "arg": "to",
        "type": "date",
        "required": false,
        "description": ""
      }
    ],
    "returns": [
      {
        "arg": "result",
        "type": "object",
        "root": true,
        "description": ""
      }
    ],
    "description": "report as time",
    "http": [
      {
        "path": "/timeStateReport",
        "verb": "get"
      }
    ]
  });

};

'use strict';
var myConfig = require('../../server/myConfig.json');
var path = require('path');
var async = require('async');
var crypto = require('crypto');
var ejs = require('ejs');

module.exports = function (User) {
	// validation
	//	User.validatesInclusionOf('gender', {in: ['male', 'female']});
	User.validatesInclusionOf('status', { in: ['pending', 'activated', 'deactivated'] });

	User.settings.acls = [{ "principalType": "ROLE", "principalId": "$everyone", "permission": "ALLOW" }];

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
		User.count({ username: { like: RegExp('^' + name + '[0-9]*') } }, function (err, count) {
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
		var options = {
			type: 'email',
			to: user.email,
			from: myConfig.email,
			subject: 'Thanks for registering.',
			template: path.resolve(__dirname, '../../server/views/emails/verifyEmail.ejs'),
			// redirect: '/verified',
			user: user,
			host: 'almersal.com',
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
		User.findOne({ where: { email: email } }, function (err, user) {
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
					var url = 'http://' + myConfig.host + '/api/users/resetPassword/' + token;
					ejs.renderFile(path.resolve(__dirname, '../../server/views/emails/resetPasswordEmail.ejs'), { url: url }, {}, function (err, template) {
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
		accepts: { arg: 'email', type: 'string', required: true, http: { source: 'form' } },
		returns: { arg: 'message', type: 'string' },
		http: { verb: 'post' },
	});

	User.getResetPassword = function (token, res, cb) {
		User.findOne({ where: { resetPasswordToken: token, resetPasswordExpires: { gt: Date.now() } } }, function (err, user) {
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
		accepts: [
			{ arg: 'token', type: 'string', required: true },
			{ arg: 'res', type: 'object', http: { source: 'res' } },
		],
		http: { verb: 'get', path: '/resetPassword/:token' },
	});



	User.resetPassword = function (token, newPassword, res, cb) {
		User.findOne({ where: { resetPasswordToken: token, resetPasswordExpires: { gt: Date.now() } } }, function (err, user) {
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
		accepts: [
			{ arg: 'token', type: 'string', required: true },
			{ arg: 'newPassword', type: 'string', required: true, http: { source: 'form' } },
			{ arg: 'res', type: 'object', http: { source: 'res' } },
		],
		returns: { arg: 'message', type: 'any' },
		http: { verb: 'post', path: '/resetPassword/:token' },
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
		accepts: [
			{ arg: 'userId', type: 'string', required: true },
			{ arg: 'agree', type: 'boolean', required: true, http: { source: 'form' } },
		],
		returns: { arg: 'message', type: 'string' },
		http: { verb: 'post', path: '/:userId/changeStatus' },
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
				res.status(202).json({ message: 'updatedSuccessfully' });
			})
		});
	};

	User.remoteMethod('updateFcmToken', {
		accepts: [
			{ arg: 'token', type: 'string', required: true },
			{ arg: "options", type: "object", http: "optionsFromRequest" },
			{ arg: 'res', type: 'object', http: { source: 'res' } },
		],
		http: { verb: 'post', path: '/fcmToken' },
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
		accepts: [
			{ arg: 'userId', type: 'string', required: true },
			{ arg: 'password', type: 'string', required: true },
		],
		returns: { arg: 'message', type: 'string' },
		http: { verb: 'put', path: '/:userId/changePassword' },
	});

	User.afterRemote("login", function (ctx, res, next) {
			
		let temp = { ...res.__data };
		User.findById(res.userId, (err, user) => {
			ctx.result = temp;
			temp.user = user;
			next();
		});

	});

};

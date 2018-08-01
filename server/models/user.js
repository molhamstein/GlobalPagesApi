'use strict';
var myConfig = require('../../server/myConfig.json');
var path = require('path');
var async = require('async');
var crypto = require('crypto');
var ejs = require('ejs');

module.exports = function(User) {
	// validation
	User.validatesInclusionOf('gender', {in: ['male', 'female']});
	User.validatesInclusionOf('status', {in: ['pending', 'activated','deactivated']});

	User.settings.acls = [ { "principalType": "ROLE", "principalId": "$everyone", "permission": "ALLOW" }]


	//send verification email after registration
	User.afterRemote('create', function(context, user, next) {
		var options = {
		  type: 'email',
		  to: user.email,
		  from: myConfig.email,
		  subject: 'Thanks for registering.',
		  template: path.resolve(__dirname, '../../server/views/emails/verifyEmail.ejs'),
		  // redirect: '/verified',
		  user: user
		};

		user.verify(options, function(err, response) {
		  if (err) {
		    User.deleteById(user.id);
		    return next(err);
		  }
		  context.res.json(user)
		});
	});

	User.forgotPassword = function(email, cb) {
		var EmailModel = User.app.models.Email;
		User.findOne({where: {email:email}}, function(err, user) {
			if (err)
        		return cb(err);
        	if (!user){
        		err = new Error('Email not found');
		        err.statusCode = 404;
		        err.code = 'EMAIL_NOT_FOUND';
		        return cb(err);
        	}
        	async.waterfall([
			    function(done) {
			      crypto.randomBytes(20, function(err, buf) {
			        var token = buf.toString('hex');
			        done(err, token);
			      });
			    },
			    function(token, done) {
			        user.resetPasswordToken = token;
			        user.resetPasswordExpires =  Date.now() + myConfig.resetPasswordExpires; // 1 hour

			        user.save(function(err) {
			          done(err, token, user);
			        });
			    },
			    function(token, user, done) {
			    	var url = 'http://' + myConfig.host + '/api/users/resetPassword/' + token;
					ejs.renderFile(path.resolve(__dirname, '../../server/views/emails/resetPasswordEmail.ejs'), {url:url}, {}, function(err, template){
						if(err)
							return done(err);
				    	var options = {
							to: user.email,
							from: myConfig.email,
							subject: 'Password Reset',
							html: template
						};
				    	// send Email
						EmailModel.send(options,done);
					});
			    }
			], function(err) {
			    if (err) return cb(err);
			    return cb(null,"done")
			    // res.redirect('/forgot');
		  	});
        });
    }

    User.remoteMethod('forgotPassword', {
    	description: 'forgot password for a user with email.',
		accepts: {arg: 'email', type: 'string', required: true, http: {source: 'body'}},
		returns: {arg: 'message', type: 'string'},
		http: {verb: 'post'},
    });

    User.getResetPassword = function(token, res, cb) {
		User.findOne({where:{resetPasswordToken: token , resetPasswordExpires: { gt: Date.now() }}},function(err,user){
			if(err)
				return cb(err);
			if (!user) {
        		err = new Error('Password reset token is invalid or has expired');
		        err.statusCode = 404;
		        // err.code = 'TOKEN_INVALID';
		        return cb(err);
		    }
		    return res.render(path.resolve(__dirname, '../../server/views/resetPasswordForm.ejs'),{
		    	user:user
		    })
		});
	};

    User.remoteMethod('getResetPassword', {
		accepts: [
			{arg: 'token', type: 'string',  required:true},
			{arg: 'res', type: 'object', http:{source:'res'}},
		],
		http: {verb: 'get',path:'/resetPassword/:token'},	
    });



    User.resetPassword = function(token, newPassword, res, cb) {
		User.findOne({where:{resetPasswordToken: token , resetPasswordExpires: { gt: Date.now() }}},function(err,user){
			if(err)
				return cb(err);
			if (!user) {
        		err = new Error('Password reset token is invalid or has expired');
		        err.statusCode = 404;
		        err.code = 'TOKEN_INVALID';
		        return cb(err);
		    }
		    user.setPassword(newPassword,(err) => {
		    	if(err)
		    		return cb(err);
		    	user.resetPasswordToken = undefined;
		    	user.resetPasswordExpires = undefined;
		    	user.save((err) => {
		    		if(err)
		    			return cb(err);
		    		return cb(null,"Success! Your password has been changed")
		    	})
		    });
		});
	};

    User.remoteMethod('resetPassword', {
		accepts: [
			{arg: 'token', type: 'string',  required:true},
			{arg: 'newPassword', type: 'string',  required:true, http:{source:'form'}},
			{arg: 'res', type: 'object', http:{source:'res'}},
		],
		returns: {arg: 'message', type: 'any'},
		http: {verb: 'post',path:'/resetPassword/:token'},	
    });

    // agree or reject user
	User.changeStatus = function(userId,status,cb){
		User.findById(userId.toString(), function(err, user) {
			if(err) 
				return cb(err);
			if(!user){
				err = new Error('User not found');
		        err.statusCode = 404;
		        err.code = 'USER_NOT_FOUND';
		        return cb(err);
			}
			// console.log("BBBBBB")
			user.status = (status)?'activated':'deactivated';
			user.save((err)=>{
				if(err)
					return cb(err)
				return cb(null, user.status);
			})
		});
	}

	User.remoteMethod('changeStatus', {
    	description: 'agree or Reject User from admin',
		accepts: [
			{arg: 'userId', type: 'string',  required:true},
			{arg: 'agree', type: 'boolean', required: true, http: {source: 'body'}},
		],
		returns: {arg: 'message', type: 'string'},
		http: {verb: 'post',path: '/:userId/changeStatus'},
    });
};

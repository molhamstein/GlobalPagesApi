'use strict';
var _ = require('lodash');
module.exports = function(Post) {
	// validation
	Post.validatesInclusionOf('status', {in: ['pending', 'activated','deactivated']});
	Post.validatesPresenceOf('categoryId');
	// Post.validatesPresenceOf('subCategoryId');

	// add ownerId to Post
	Post.beforeRemote('create', function( ctx, modelInstance, next) {
		if(!ctx.req.body.ownerId)
			ctx.req.body.ownerId = ctx.args.options.accessToken.userId
		var tempId = 1;
		_.each(ctx.req.body.media,(m)=>{m.id= tempId++});
	    next();
	});

	Post.beforeRemote('replaceById', function( ctx, modelInstance, next) {
		if(!ctx.req.body.ownerId)
			ctx.req.body.ownerId = ctx.args.options.accessToken.userId
		var tempId = 1;
		_.each(ctx.req.body.media,(m)=>{m.id= tempId++});
	    next();
	});

	// agree or reject Post
	Post.changeStatus = function(postId,status,cb){
		Post.findById(postId.toString(),{}, function(err, post) {
			if(err) 
				return cb(err);
			if(!post){
				err = new Error('post not found');
		        err.statusCode = 404;
		        err.code = 'POST_NOT_FOUND';
		        return cb(err);
			}
			// console.log("BBBBBB")
			post.status = (status)?'activated':'deactivated';
			post.save((err)=>{
				if(err)
					return cb(err)
				return cb(null, post.status);
			})
		});
	}
	Post.remoteMethod('changeStatus', {
    	description: 'agree or Reject Post from admin',
		accepts: [
			{arg: 'postId', type: 'string',  required:true},
			{arg: 'agree', type: 'boolean', required: true, http: {source: 'body'}},
		],
		returns: {arg: 'message', type: 'string'},
		http: {verb: 'post',path: '/:postId/changeStatus'},
    });

    // plus viewsCount
	Post.plusviewsCount = function(postId,cb){
		Post.findById(postId.toString(),{}, function(err, post) {
			if(err) 
				return cb(err);
			if(!post){
				err = new Error('Post not found');
		        err.statusCode = 404;
		        err.code = 'POST_NOT_FOUND';
		        return cb(err);
			}

			post.viewsCount++;
			return post.save(cb)
		});
	}

	Post.remoteMethod('plusviewsCount', {
    	description: 'plus +1 to viewsCount',
		accepts: {arg: 'postId', type: 'string',  required:true},
		// returns: {arg: 'message', type: 'string'},
		http: {verb: 'post',path: '/:postId/viewsCount'},
    });
};

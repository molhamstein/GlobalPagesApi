'use strict';

module.exports = function(Ads) {
	// validation
	Ads.validatesInclusionOf('status', {in: ['pending', 'activated','deactivated']});
	Ads.validatesPresenceOf('categoryId');
	// Ads.validatesPresenceOf('subCategoryId');

	// add ownerId to ads
	Ads.beforeRemote('create', function( ctx, modelInstance, next) {
		ctx.req.body.ownerId = ctx.args.options.accessToken.userId
	    next();
	});

	// agree or reject ads
	Ads.changeStatus = function(adId,status,cb){
		Ads.findById(adId.toString(),{}, function(err, ad) {
			if(err) 
				return cb(err);
			if(!ad){
				err = new Error('post not found');
		        err.statusCode = 404;
		        err.code = 'POST_NOT_FOUND';
		        return cb(err);
			}
			// console.log("BBBBBB")
			ad.status = (status)?'activated':'deactivated';
			ad.save((err)=>{
				if(err)
					return cb(err)
				return cb(null, ad.status);
			})
		});
	}
	Ads.remoteMethod('changeStatus', {
    	description: 'agree or Reject ads from admin',
		accepts: [
			{arg: 'postId', type: 'string',  required:true},
			{arg: 'agree', type: 'boolean', required: true, http: {source: 'body'}},
		],
		returns: {arg: 'message', type: 'string'},
		http: {verb: 'post',path: '/:postId/changeStatus'},
    });

    // plus viewsCount
	Ads.plusviewsCount = function(postId,cb){
		Ads.findById(postId.toString(),{}, function(err, ad) {
			if(err) 
				return cb(err);
			if(!ad){
				err = new Error('Post not found');
		        err.statusCode = 404;
		        err.code = 'POST_NOT_FOUND';
		        return cb(err);
			}

			ad.viewsCount++;
			return ad.save(cb)
		});
	}

	Ads.remoteMethod('plusviewsCount', {
    	description: 'plus +1 to viewsCount',
		accepts: {arg: 'postId', type: 'string',  required:true},
		// returns: {arg: 'message', type: 'string'},
		http: {verb: 'post',path: '/:postId/viewsCount'},
    });
};

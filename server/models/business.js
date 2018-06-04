'use strict';

module.exports = function(Business) {
	// validation
	Business.validatesInclusionOf('status', {in: ['pending', 'activated','deactivated']});
	Business.validatesPresenceOf('categoryId');

	// add ownerId to Business
	Business.beforeRemote('create', function( ctx, modelInstance, next) {
		ctx.req.body.ownerId = ctx.args.options.accessToken.userId;
		var name = ctx.req.body.nameEn.trim().replace(/ * /g,'.');
		
		// make unique name
		Business.count({nameUnique : {like : RegExp('^' + name + '[0-9]*')}},function(err,count){
			if(err)
				return next(err);
			
			ctx.req.body.nameUnique = name;
			if(count != 0)
				ctx.req.body.nameUnique = name + (count.toString())
	    	next();
		});
	});

	// agree or reject Business
	Business.changeStatus = function(businessId,status,cb){
		Business.findById(businessId.toString(),{}, function(err, business) {
			if(err) 
				return cb(err);
			if(!business){
				err = new Error('usiness not found');
		        err.statusCode = 404;
		        err.code = 'BUSINESS_NOT_FOUND';
		        return cb(err);
			}
			business.status = (status)?'activated':'deactivated';
			business.save((err)=>{
				if(err)
					return cb(err)
				return cb(null, business.status);
			})
		});
	}
	Business.remoteMethod('changeStatus', {
    	description: 'agree or Reject business from admin',
		accepts: [
			{arg: 'businessId', type: 'string',  required:true},
			{arg: 'agree', type: 'boolean', required: true, http: {source: 'body'}},
		],
		returns: {arg: 'message', type: 'string'},
		http: {verb: 'post',path: '/:businessId/changeStatus'},
    });

	// to get busniess By nameUnique
	Business.afterRemote('findById', function(ctx,result, next) {
		if(result)
			return next();

		Business.findOne({where: {nameUnique : ctx.args.id}},function(err,busniess){
			if(err  || !busniess)
				return next(err);
	  		return ctx.res.json(busniess)
		})
	});
};

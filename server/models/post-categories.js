'use strict';
var _ = require('lodash')
module.exports = function(Adcategories) {
	// Adcategories.validatesPresenceOf('parentCategoryId');

	Adcategories.afterRemote('create', function( ctx, result, next) {
		var subCategories = ctx.req.body.subCategories
		_.each(subCategories,(sub) =>{
			sub.parentCategoryId = result.id
		});


		Adcategories.create(subCategories,function(err,categories){
			if(err) 
				return next(err);
			// result.subCategories = categories;
			return next();
		});
	});

	Adcategories.getChildCategory = function(categoryId,cb){
		Adcategories.find({where : {parentCategoryId : categoryId}},{}, cb);
	}

	Adcategories.remoteMethod('getChildCategory', {
    	description: 'get All Cild category Ids  for category',
		accepts: [
			{arg: 'categoryId', type: 'string',  required:true},
		],
		returns: {arg: 'data', type: 'array'},
		http: {verb: 'get',path: '/:categoryId/children'},
    });
};

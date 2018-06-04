'use strict';

module.exports = function(Adcategories) {
	// Adcategories.validatesPresenceOf('parentCategoryId');


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

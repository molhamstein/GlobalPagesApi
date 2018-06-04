'use strict';

module.exports = function(Businesscategory) {
	// Adcategories.validatesPresenceOf('parentCategoryId');


	Businesscategory.getChildCategory = function(categoryId,cb){
		Businesscategory.find({where : {parentCategoryId : categoryId}},{}, cb);
	}

	Businesscategory.remoteMethod('getChildCategory', {
    	description: 'get All Cild category Ids  for category',
		accepts: [
			{arg: 'categoryId', type: 'string',  required:true},
		],
		returns: {arg: 'data', type: 'array'},
		http: {verb: 'get',path: '/:categoryId/children'},
    });
};

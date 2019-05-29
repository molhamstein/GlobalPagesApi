'use strict';


module.exports = function (Businesscategory) {
	// Adcategories.validatesPresenceOf('parentCategoryId');


	Businesscategory.getChildCategory = function (categoryId, cb) {
		Businesscategory.find({ where: { parentCategoryId: categoryId } }, {}, cb);
	}

	Businesscategory.remoteMethod('getChildCategory', {
		description: 'get All Cild category Ids  for category',
		accepts: [
			{ arg: 'categoryId', type: 'string', required: true },
		],
		returns: { arg: 'data', type: 'array' },
		http: { verb: 'get', path: '/:categoryId/children' },
	});



	Businesscategory.once("attached", function () {


		Businesscategory.deleteById = async function (id, auth, cb) {


			let category = await Businesscategory.findById(id);
			if (!category)
				throw { message: "Resource not found", code: 404 };


			// delete subCategory
			for (let subCategory of await category.subCategories.find()) {
				subCategory.updateAttribute("deleted", true);
			}
			// delete businesses
			for (let business of await Businesscategory.app.models.business.find({ where: { or: [{ categoryId: id }, { subCategoryId: id }] } })) {
				business.updateAttribute("deleted", true);
			}
			//delete self
			category.updateAttribute("deleted", true);



			return "deleted";
		}


	});


	
	// execlude deleted entities 
	Businesscategory.observe('access', async function (ctx) {

		ctx.query = ctx.query || {};
		ctx.query.where = ctx.query.where || {};
		if (!ctx.query.where.deleted) {
			ctx.query.where.deleted = false;
		}
	});

};

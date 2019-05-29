'use strict';
var _ = require('lodash')
module.exports = function (Adcategories) {
	// Adcategories.validatesPresenceOf('parentCategoryId');

	Adcategories.afterRemote('create', function (ctx, result, next) {
		var subCategories = ctx.req.body.subCategories || [];
		_.each(subCategories, (sub) => {
			sub.parentCategoryId = result.id
		});


		Adcategories.create(subCategories, function (err, categories) {
			if (err)
				return next(err);
			// result.subCategories = categories;
			return next();
		});
	});

	Adcategories.getChildCategory = function (categoryId, cb) {
		Adcategories.find({ where: { parentCategoryId: categoryId } }, {}, cb);
	}

	Adcategories.remoteMethod('getChildCategory', {
		description: 'get All Cild category Ids  for category',
		accepts: [
			{ arg: 'categoryId', type: 'string', required: true },
		],
		returns: { arg: 'data', type: 'array' },
		http: { verb: 'get', path: '/:categoryId/children' },
	});





	Adcategories.once("attached", function () {


		Adcategories.deleteById = async function (id, auth, cb) {
			

			let category = await Adcategories.findById(id);
			if (!category)
				throw { message: "Resource not found", code: 404 };


			// delete subCategory
			for (let subCategory of await category.subCategories.find()) {
				subCategory.updateAttribute("deleted", true);
			}
			// delete posts
			for (let post of await Adcategories.app.models.posts.find({ where: { or: [{ categoryId: id }, { subCategoryId: id }] } })) {
				post.updateAttribute("deleted", true);
			}
			//delete self
			category.updateAttribute("deleted", true);



			return "deleted";
		}


	});


	// execlude deleted entities 
	Adcategories.observe('access', async function (ctx) {

		ctx.query = ctx.query || {};
		ctx.query.where = ctx.query.where || {};
		if (!ctx.query.where.deleted) {
			ctx.query.where.deleted = false;
		}
	});



};

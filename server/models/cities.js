'use strict';
var _ = require('lodash');
module.exports = function (Cities) {
	Cities.afterRemote('create', function (ctx, result, next) {
		var locations = ctx.req.body.locations || []
		_.each(locations, (loc) => {
			loc.cityId = result.id
		});


		Cities.app.models.locations.create(locations, function (err, locations) {
			if (err)
				return next(err);
			// result.locations = locations;
			return next();
		});
	});



	Cities.once("attached", function () {


		Cities.deleteById = async function (id, auth, cb) {


			let city = await Cities.findById(id);
			if (!city)
				throw { message: "Resource not found", code: 404 };


			// delete posts
			for (let post of await city.posts.find()) {
				post.updateAttribute("deleted", true);
			}

			// delete businesses
			for (let business of await city.businesses.find()) {
				business.updateAttribute("deleted", true);
			}


			//	delete locations
			for (let location of await city.locations.find()) {
				location.updateAttribute("deleted", true);
			}

			//delete self
			category.updateAttribute("deleted", true);

			return "deleted";
		}


	});



	
	
	// execlude deleted entities 
	Cities.observe('access', async function (ctx) {

		ctx.query = ctx.query || {};
		ctx.query.where = ctx.query.where || {};
		if (!ctx.query.where.deleted) {
			ctx.query.where.deleted = false;
		}
	});


};

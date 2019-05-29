'use strict';

module.exports = function (Locations) {


	Locations.once("attached", function () {

		Locations.deleteById = async function (id, auth, cb) {

			let location = await Locations.findById(id);
			if (!location)
				throw { message: "Resource not found", code: 404 };


			// delete posts
			for (let post of await location.posts.find()) {
				post.updateAttribute("deleted", true);
			}

			// delete businesses
			for (let business of await location.businesses.find()) {
				business.updateAttribute("deleted", true);
			}

			//delete self

			location.updateAttribute("deleted", true);

			return "deleted";
		}


	});



	// execlude deleted entities 
	Locations.observe('access', async function (ctx) {

		ctx.query = ctx.query || {};
		ctx.query.where = ctx.query.where || {};
		if (!ctx.query.where.deleted) {
			ctx.query.where.deleted = false;
		}
	});
};

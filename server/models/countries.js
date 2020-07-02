'use strict';
var _ = require('lodash');
module.exports = function (Countries) {



	Countries.once("attached", function () {


		Countries.deleteById = async function (id, auth, cb) {


			let country = await Countries.findById(id);
			if (!country)
				throw { message: "Resource not found", code: 404 };


			//delete self
			country.updateAttribute("deleted", true);

			return "deleted";
		}


	});





	// execlude deleted entities 
	Countries.observe('access', async function (ctx) {

		ctx.query = ctx.query || {};
		ctx.query.where = ctx.query.where || {};
		if (!ctx.query.where.deleted) {
			ctx.query.where.deleted = false;
		}
	});


};

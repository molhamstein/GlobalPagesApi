'use strict';
var _ = require('lodash');
module.exports = function (Business) {
	// validation
	Business.validatesInclusionOf('status', { in: ['pending', 'activated', 'deactivated'] });
	Business.validatesPresenceOf('categoryId');

	// add ownerId to Business
	Business.beforeRemote('create', function (ctx, modelInstance, next) {
		if (!ctx.req.body.ownerId)
			ctx.req.body.ownerId = ctx.args.options.accessToken.userId;
		var name = ctx.req.body.nameEn.trim().replace(/ * /g, '.');

		// make unique name
		Business.count({ nameUnique: { like: RegExp('^' + name + '[0-9]*') } }, function (err, count) {
			if (err)
				return next(err);

			ctx.req.body.nameUnique = name;
			if (count != 0)
				ctx.req.body.nameUnique = name + (count.toString())

			var tempId = 1;
			_.each(ctx.req.body.covers, (m) => { m.id = tempId++ });
			var tempId = 1;
			_.each(ctx.req.body.products, (m) => { m.id = tempId++ });

			next();
		});
	});

	Business.beforeRemote('replaceById', function (ctx, modelInstance, next) {
		if (!ctx.req.body.ownerId)
			ctx.req.body.ownerId = ctx.args.options.accessToken.userId
		var tempId = 1;
		_.each(ctx.req.body.covers, (m) => { m.id = tempId++ });
		var tempId = 1;
		_.each(ctx.req.body.products, (m) => { m.id = tempId++ });
		next();
	});

	// agree or reject Business
	Business.changeStatus = function (businessId, status, cb) {
		Business.findById(businessId.toString(), {}, function (err, business) {
			if (err)
				return cb(err);
			if (!business) {
				err = new Error('usiness not found');
				err.statusCode = 404;
				err.code = 'BUSINESS_NOT_FOUND';
				return cb(err);
			}
			business.status = (status) ? 'activated' : 'deactivated';
			business.save((err) => {
				if (err)
					return cb(err)
				return cb(null, business.status);
			})
		});
	}
	Business.remoteMethod('changeStatus', {
		description: 'agree or Reject business from admin',
		accepts: [
			{ arg: 'businessId', type: 'string', required: true },
			{ arg: 'agree', type: 'boolean', required: true, http: { source: 'body' } },
		],
		returns: { arg: 'message', type: 'string' },
		http: { verb: 'post', path: '/:businessId/changeStatus' },
	});

	// to get busniess By nameUnique


	Business.afterRemote('findById', async function (ctx) {


		if (!ctx.result) {
			ctx.result = await Business.findOne({ where: { nameUnique: ctx.args.id } });
		}

	});

	// execlude deleted entities 
	Business.observe('access', async function (ctx) {

		ctx.query = ctx.query || {};
		ctx.query.where = ctx.query.where || {};
		if (!ctx.query.where.deleted) {
			ctx.query.where.deleted = false;
		}
	});


	Business.once("attached", function () {


		Business.deleteById = async function (id, auth, cb) {


			let business = await Business.findById(id);
			if (!business)
				throw { message: "Resource not found", code: 404 };


			business.updateAttribute("deleted", true);


			return "deleted";
		}


	});




	Business.searchByLocation = function (lat, lng, keyword, catId, subCatId, codeCat, codeSubCat, openingDay, limit, res, cb) {
		var where = {
			// status : 'activated'
		};

		if (lat)
			_.set(where, 'locationPoint.near.lat', lat);
		if (lng)
			_.set(where, 'locationPoint.near.lng', lng);
		if (catId) where.categoryId = catId;
		if (subCatId) where.subCategoryId = subCatId;
		if (keyword) where.or = [
			{ nameEn: { like: RegExp(keyword) } },
			{ nameAr: { like: RegExp(keyword) } },
			{ nameUnique: { like: RegExp(keyword) } },
			{ description: { like: RegExp(keyword) } }
		]
		if (openingDay) {
			where.openingDaysEnabled = true;
			where.openingDays = openingDay;
		}

		if ((lat && !lng) || (lng && !lat)) {
			var err = new Error('lat and lng both required');
			err.statusCode = 400;
			err.code = 'LATLNGREQUIRED';
			return cb(err);
		}

		if (lat && lat > 90) {
			var err = new Error('lat must be <= 90');
			err.statusCode = 400;
			err.code = 'LAT>90';
			return cb(err);
		}
		if (lng && lng > 180) {
			var err = new Error('lng must be <= 180');
			err.statusCode = 400;
			err.code = 'LNG>180';
			return cb(err);
		}

		getCategorybyCode(codeCat, (err, category) => {
			if (err)
				return cb(err);
			if (category) where.categoryId = category.id;

			getCategorybyCode(codeSubCat, (err, subCategory) => {
				if (err)
					return cb(err);
				if (subCategory) where.subCategoryId = subCategory.id;

				var query = { where: where  ,  order: ['vip'] };
				console.log(where);
				if (limit) query.limit = limit;
				Business.find(query, function (err, business) {
					if (err)
						return cb(err);
					return res.status(200).json(business)
				});
			});
		});
	}
	Business.remoteMethod('searchByLocation', {
		// description: '',
		accepts: [
			{ arg: 'lat', type: 'number', http: { source: 'query' } },
			{ arg: 'lng', type: 'number', http: { source: 'query' } },
			{ arg: 'keyword', type: 'string', http: { source: 'query' } },
			{ arg: 'catId', type: 'string', http: { source: 'query' } },
			{ arg: 'subCatId', type: 'string', http: { source: 'query' } },
			{ arg: 'codeCat', type: 'string', http: { source: 'query' } },
			{ arg: 'codeSubCat', type: 'string', http: { source: 'query' } },
			{ arg: 'openingDay', type: 'number', http: { source: 'query' } },
			{ arg: 'limit', type: 'number', http: { source: 'query' } },
			{ arg: 'res', type: 'object', http: { source: 'res' } },
		],
		http: { verb: 'get', path: '/searchByLocation' },
	});


	var getCategorybyCode = function (code, cb) {
		if (!code || code == 'default')
			return cb(null, null);
		return Business.app.models.businessCategories.findOne({ where: { code: code } }, cb);
	}
};

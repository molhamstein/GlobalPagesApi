'use strict';
var _ = require('lodash');
module.exports = function(Cities) {
	Cities.afterRemote('create', function( ctx, result, next) {
		var locations = ctx.req.body.locations || []
		_.each(locations,(loc) =>{
			loc.cityId = result.id
		});


		Cities.app.models.locations.create(locations,function(err,locations){
			if(err) 
				return next(err);
			// result.locations = locations;
			return next();
		});
	});
};

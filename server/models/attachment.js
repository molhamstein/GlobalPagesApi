'use strict';
var _ = require('lodash');
var myConfig = require('../myConfig');
module.exports = function(Attachment) {

	Attachment.afterRemote('upload', function(ctx,result, next) {
		if(!result || !result.result || !result.result.files )
			return next();
		var urls = [];
		var r = result.result.files.file
		_.each(r,function(file){
			var object = {
				url : myConfig.baseUrl + file.container + '/' + file.name,

			}

			if(false){  // if(file.url in extention videos)
				// create thumbnail
				object.thumbnail = '';
				object.type = 'video';

			}
			urls.push(object)
		});
		ctx.result = urls;
		return next();

		
	});

};

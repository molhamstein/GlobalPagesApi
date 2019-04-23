'use strict';
var _ = require('lodash');
var fs = require('fs');
var async = require('async');
var myConfig = require('../myConfig');
const path = require('path');
var sharp = require('sharp');
var sizeOf = require('image-size');
var ffmpeg = require('fluent-ffmpeg');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfprobePath(ffprobePath);
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = function(Attachment) {
	Attachment.afterRemote('upload', function(ctx,result, next) {
		if(!result || !result.result || !result.result.files )
			return next();
		ctx.result = [];
		var r = result.result.files.file
		async.each(r,function(file,cb){
			var object = {
				url : myConfig.host + '/' + file.container + '/' + file.name,
			}

			if(file.container == 'images'){
				var dim = sizeOf(path.join(__dirname, '../../files/',file.container,file.name));
				sharp(path.join(__dirname, '../../files/',file.container,file.name))
				  .resize({width : dim.width/2,height : dim.height/2 })
				  .flatten()
				  .jpeg({quality : 30})
				  .toBuffer()
				  .then(data => {
				  	fs.writeFile("./files/thumb/"+file.name.split(".")[0]+".jpeg", data, "binary", function(err) {
				  		if(err)
				  			return cb(err);
						object.thumbnail =  myConfig.host + '/thumb/' + file.name.split(".")[0] + '.jpeg';
						ctx.result.push(object);
						return cb();
					});
				  })
				  .catch(data=>{
				  	console.log(data);
				  	cb(data);
				  })
			}

			if(file.container == 'videos'){
				var thumbName = file.name.substring(0, file.name.lastIndexOf('.')) + ".PNG";
				 ffmpeg(path.join(__dirname, '../../files/',file.container,file.name))
                    .screenshot({
                        count: 1,
                        filename: thumbName,
                        folder: path.join(__dirname, '../../files/videos_thumb'),
                        size: '320x240'
                    });
				object.thumbnail = myConfig.host + '/videos_thumb/' + thumbName;
				object.type = 'video';
				ctx.result.push(object);
				return cb();

			}


		},next);
		
	});

};

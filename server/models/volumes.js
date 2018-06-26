'use strict';
var notification = require('../notification');
module.exports = function(Volumes) {
	Volumes.validatesInclusionOf('status', {in: ['pending', 'activated','deactivated']});

	Volumes.changeStatus = function(volumeId,status,cb){
		Volumes.findById(volumeId.toString(),{}, function(err, volume) {
			if(err) 
				return cb(err);
			if(!volume){
				err = new Error('VOLUME not found');
		        err.statusCode = 404;
		        err.code = 'VOLUME_NOT_FOUND';
		        return cb(err);
			}
			volume.status = (status)?'activated':'deactivated';
			volume.save((err)=>{
				if(err)
					return cb(err)
				cb(null, volume.status);
				// notification 
				notification.addNewVolume(Volumes,volume);
			})
		});
	}
	Volumes.remoteMethod('changeStatus', {
    	description: 'agree or Reject Volumes from admin',
		accepts: [
			{arg: 'volmeId', type: 'string',  required:true},
			{arg: 'agree', type: 'boolean', required: true, http: {source: 'body'}},
		],
		returns: {arg: 'message', type: 'string'},
		http: {verb: 'post',path: '/:volmeId/changeStatus'},
    });
};

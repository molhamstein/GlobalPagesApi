'use strict';
var notification = require('../notification');
module.exports = function (Volumes) {
	Volumes.validatesInclusionOf('status', { in: ['pending', 'activated', 'deactivated'] });

	Volumes.changeStatus = function (volumeId, status, cb) {
		Volumes.findById(volumeId.toString(), {}, function (err, volume) {
			if (err)
				return cb(err);
			if (!volume) {
				err = new Error('VOLUME not found');
				err.statusCode = 404;
				err.code = 'VOLUME_NOT_FOUND';
				return cb(err);
			}
			volume.status = (status) ? 'activated' : 'deactivated';
			volume.save((err) => {
				if (err)
					return cb(err)
				cb(null, volume.status);
				// notification
				if (volume.status == 'activated')
					notification.addNewVolume(Volumes, volume);
			})
		});
	}
	Volumes.remoteMethod('changeStatus', {
		description: 'agree or Reject Volumes from admin',
		accepts: [
			{ arg: 'volmeId', type: 'string', required: true },
			{ arg: 'agree', type: 'boolean', required: true, http: { source: 'body' } },
		],
		returns: { arg: 'message', type: 'string' },
		http: { verb: 'post', path: '/:volmeId/changeStatus' },
	});


	Volumes.afterRemote("create", async function (ctx, result) {
		let volume = result;
		if (volume.status == 'activated')
			notification.addNewVolume(Volumes, volume);

	});

	// edit hook 
	Volumes.beforeRemote('replaceById', async function (ctx, instance) {
		let newStatus = ctx.req.body.status;
		let { id } = ctx.req.params;

		let volume = await Volumes.app.models.volumes.findById(id);

		if (volume) {
			let oldStatus = volume.status;
			if (oldStatus == "deactivated" && newStatus == "activated") {
				ctx.notifiy = true;
			}
		}
		//console.log(ctx); 

	});


	// edit hook 
	Volumes.afterRemote('replaceById', async function (ctx, instance) {
		if (typeof ctx.notifiy !== "undefined" && ctx.notifiy == true) {
			notification.addNewVolume(Volumes, instance);
		}
	});


};

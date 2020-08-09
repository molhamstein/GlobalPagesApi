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
			if (oldStatus != "activated" && newStatus == "activated") {
				ctx.notifiy = true;
			}
		}
		//console.log(ctx); 

	});



	Volumes.once("attached", function () {
		Volumes.deleteById = async function (id, auth, cb) {

			let volume = await Volumes.findById(id);
			console.log(volume);
			if (!volume)
				throw { message: "Resource not found", code: 404 };

			//delete self
			volume.updateAttribute("deleted", true);

			return "deleted";
		}


	});

	Volumes.observe('access', async function (ctx) {

		ctx.query = ctx.query || {};
		ctx.query.where = ctx.query.where || {};
		if (!ctx.query.where.deleted) {
			ctx.query.where.deleted = false;
		}
	});

	// edit hook 
	Volumes.afterRemote('replaceById', async function (ctx, instance) {
		if (typeof ctx.notifiy !== "undefined" && ctx.notifiy == true) {
			notification.addNewVolume(Volumes, instance);
		}
	});


	var CronJob = require('cron').CronJob;
	// var createVolume = new CronJob('1 0 * * 6', function () {
	// var createVolume = new CronJob('4 14 * * 1', async function () {
	// });
	var publishVolume = new CronJob('0 19 * * 5', async function () {
		// var publishVolume = new CronJob('19 15 * * 1', async function () {
		let volume = await Volumes.findOne({ "order": "creationDate DESC" })
		if (volume && volume.status == 'pending') {
			await volume.updateAttribute("status", "activated")
			notification.addNewVolume(Volumes, volume);
		}

		const today = new Date()
		var title = today.getFullYear() + " - " + today.getDate() + " - " + today.toLocaleString('default', { month: 'long' })
		var volumeObj = {
			"titleAr": title,
			"titleEn": title,
		}
		let newVolumes = await Volumes.create(volumeObj)
	});
	// createVolume.start();
	publishVolume.start();
};

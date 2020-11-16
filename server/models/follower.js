'use strict';

module.exports = function (Follower) {

    Follower.makeFollow = async function (id, type = "USER", req, callback) {
        let userId = req.accessToken.userId;
        let hasFollow = await Follower.findOne({ "where": { "ownerId": userId, "objectId": id, type } })
        if (hasFollow != null) {
            var err = new Error('allready following');
            err.statusCode = 603;
            err.code = 'ALREADY_FOLLOWING';
            return callback(err);
        }
        let owner = await Follower.app.models.user.findById(userId);

        if (type == "USER") {
            let userFollowing = owner.userFollowing + 1;
            await owner.updateAttribute("userFollowing", userFollowing);


            let user = await Follower.app.models.user.findById(id);
            let follower = user.follower + 1;
            await user.updateAttribute("follower", follower);
        } else {

            let businessFollowing = owner.businessFollowing + 1;
            await owner.updateAttribute("businessFollowing", businessFollowing);

            let business = await Follower.app.models.business.findById(id);
            let follower = business.follower + 1;
            await business.updateAttribute("follower", follower);
        }

        let newFollow = await Follower.create({ "objectId": id, ownerId: owner.id, type })
        callback(null, newFollow)
    }
    Follower.remoteMethod('makeFollow', {
        description: '',
        accepts: [{
            arg: 'id',
            type: 'string',
            required: true,
        },
        {
            arg: 'type',
            type: 'string',
            required: true,
        },
        {
            arg: "req",
            type: "object",
            required: true,
            description: "",
            "http": {
                "source": "req"
            }
        }],
        returns: {
            arg: 'message',
            type: 'object',
            root: true
        },
        http: {
            verb: 'post',
            path: '/makeFollow'
        },
    });

    Follower.makeUnfollow = async function (id, req, callback) {
        let userId = req.accessToken.userId;
        let hasFollow = await Follower.findOne({ "where": { "ownerId": userId, "objectId": id } })
        if (hasFollow == null) {
            var err = new Error('not following');
            err.statusCode = 602;
            err.code = 'NOT_FOLLOWING';
            return callback(err);
        }
        let owner = await Follower.app.models.user.findById(req.accessToken.userId);
        let data = {}

        if (hasFollow.type == 'USER') {
            let user = await Follower.app.models.user.findById(id);
            let follower = user.follower - 1;
            await user.updateAttribute("follower", follower);
            data = { "userFollowing": owner.userFollowing - 1 }
        } else {
            let business = await Follower.app.models.business.findById(id);
            let follower = business.follower - 1;
            await business.updateAttribute("follower", follower);
            data = { "businessFollowing": owner.businessFollowing - 1 }

        }
        await owner.updateAttributes(data);
        await Follower.destroyAll({ objectId: id, ownerId: owner.id })
        callback(null, {})
    }
    Follower.remoteMethod('makeUnfollow', {
        description: '',
        accepts: [{
            arg: 'id',
            type: 'string',
            required: true
        },
        {
            arg: "req",
            type: "object",
            required: true,
            description: "",
            "http": {
                "source": "req"
            }
        }],
        returns: {
            arg: 'message',
            type: 'object',
            root: true
        },
        http: {
            verb: 'delete',
            path: '/makeUnfollow'
        },
    });
};

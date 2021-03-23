'use strict';
var http = require('http');

module.exports = function (Activationcode) {
    Activationcode.sendNewCode = function (ownerId, callback) {
        // try {


        Activationcode.app.models.User.findById(ownerId, function (err, owner) {
            let code = Activationcode.app.service.makeCode(4, true);
            let expiredDate = Activationcode.app.service.addHourse(0.25, new Date())
            Activationcode.create({ "code": code, "ownerId": ownerId, "expiredDate": expiredDate }, function (err, newCode) {
                if (err)
                    return callback(err)
                console.log(newCode)
                callback(null, newCode)
                http.get(
                    "https://services.mtnsyr.com:7443/General/MTNSERVICES/ConcatenatedSender.aspx?User=mers275&Pass=las121715&From=Al%20Mersal&Gsm=963957465876&Msg=hello&Lang=0",
                    function (res) {
                        res.on('data', function (data) {
                            console.log(data.toString());
                            callback(null, data)

                        });
                    }
                ).on('error', function (error) {
                    console.log(error)
                    callback(error)

                    // data = {
                    //     name: "can't send sms",
                    //     status: 604,
                    //     message: "please check your sms api"
                    // };
                });

            });

        });
    }

    // Activationcode.useActivationCode = async function (code, context, callback) {
    //     try {
    //         // var userId = context.req.accessToken.userId;
    //         await Invitationcode.app.dataSources.mainDB.transaction(async models => {
    //             const {
    //                 invitationCode
    //             } = models
    //             const {
    //                 users
    //             } = models

    //             // let user = await user.findById(userId);
    //             // let code = Invitationcode.app.service.makeCode(6);
    //             let mainCode = await invitationCode.findOne({ "where": { "code": code }, "order": "createdAt DESC" });
    //             if (mainCode == null || mainCode.used) {
    //                 throw Invitationcode.app.err.global.notFound()
    //             }
    //             mainCode = await mainCode.updateAttribute('used', true);
    //             let owner = await users.findById(mainCode.userId);
    //             let newTotalCodeCount = owner.totalCodeCount + 1
    //             let updatedData = {
    //                 "totalCodeCount": owner.totalCodeCount + 1,
    //                 "currentCodeCount": owner.currentCodeCount + 1
    //             }
    //             if (updatedData.currentCodeCount == 5) {
    //                 updatedData.currentCodeCount = 0;
    //                 updatedData.validDate = Invitationcode.app.service.addMounth(1, owner.validDate)
    //             }

    //             await owner.updateAttributes(updatedData)
    //             callback(null)
    //         })
    //     } catch (error) {
    //         callback(error)
    //     }
    // }



};

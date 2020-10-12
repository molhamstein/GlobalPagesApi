'use strict';

module.exports = function (Contact) {

    Contact.asyncContact = async function (data, req, callback) {

        let userId = req.accessToken.userId;
        let allNumber = []
        data.forEach(element => {
            allNumber.push(element.number)
        });


        let oldUser = await Contact.find({ "where": { "number": { "inq": allNumber }, "ownerId": userId } })
        let oldNumber = []
        oldUser.forEach(element => {
            oldNumber.push(element.number);
        });


        let newNumber = []
        let newContact = []
        data.forEach(element => {
            if (oldNumber.indexOf(element.number) === -1) {
                newNumber.push(element.number)
                newContact.push({ "name": element.name, "number": element.number, "ownerId": userId })
            }
        });


        await Contact.create(newContact)
        let users = await Contact.app.models.user.find({ "where": { "phoneNumber": { "inq": newNumber } } })
        users.forEach(async element => {
            let hasOldChat = await Contact.app.models.Chats.findOne({ "where": { "and": [{ "type": "chat" }, { "or": [{ "membersId": [element.id, userId] }, { "membersId": [userId, element.id] }] }] } })
            if (hasOldChat == null) {
                let chat = await Contact.app.models.Chats.create({ "type": "chat", "membersId": [element.id, userId] })
                await Contact.app.models.chatMembers.create([{ "userId": element.id, "chatId": chat.id }, { "userId": userId, "chatId": chat.id }])
            }
        });
    }
    Contact.remoteMethod('asyncContact', {
        description: '',
        accepts: [{
            arg: 'data',
            type: 'array',
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
            verb: 'post',
            path: '/asyncContact'
        },
    });
};

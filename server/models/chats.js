'use strict';
const socket = require('../bin/socketio.js')

module.exports = function (Chats) {
    Chats.addMember = async function (id, newUserId, req, callback) {
        try {
            let userId = req.accessToken.userId
            let chat = await Chats.findById(id)
            if (chat == null) {
                // throw
                console.log("sss");
            }
            let admin = await Chats.app.models.chatMembers.findOne({ "where": { "userId": userId, "chatId": id, "isAdmin": true } })
            if (admin == null) {
                console.log("ssss")
            }
            console.log(newUserId)
            console.log(chat.membersId)
            let isInChat = chat.membersId.indexOf(newUserId) == -1 ? false : true
            console.log(isInChat)
            if (isInChat) {
                console.log("SSSS");
            }
            let tempChatMember = chat.membersId;
            tempChatMember.push(newUserId);

            await chat.updateAttribute('membersId', tempChatMember);
            let newMember = await Chats.app.models.chatMembers.create({ "userId": newUserId, "chatId": id })
            let newChat = await Chats.findById(id)
            tempChatMember.forEach(element => {
                if (Chats.app._userSocket[element]) {
                    console.log("sssssssss")
                    Chats.app._userSocket[element].emit('updateChat', newChat)
                }
            });
        } catch (error) {
            callback(error)
        }
    }
    Chats.removeMember = async function (id, removeUserId, req, callback) {
        try {
            let userId = req.accessToken.userId
            let chat = await Chats.findById(id)
            if (chat == null) {
                // throw
                console.log("sss");
            }
            let admin = await Chats.app.models.chatMembers.findOne({ "where": { "userId": userId, "chatId": id, "isAdmin": true } })
            if (admin == null) {
                console.log("ssss")
            }
            let indexUser = chat.membersId.indexOf(removeUserId)
            if (indexUser == -1) {
                console.log("SSSS");
            }
            let tempChatMember = chat.membersId;
            tempChatMember.splice(indexUser, 1);
            await chat.updateAttribute('membersId', tempChatMember);
            await Chats.app.models.chatMembers.destroyAll({ "userId": removeUserId })
            let newChat = await Chats.findById(id)
            if (Chats.app._userSocket[removeUserId]) {
                Chats.app._userSocket[removeUserId].emit('removeFromChat', { "id": id })
            }
            // tempChatMember.push(removeUserId)
            tempChatMember.forEach(element => {
                if (Chats.app._userSocket[element]) {
                    Chats.app._userSocket[element].emit('updateChat', newChat)
                }
            });
        } catch (error) {
            callback(error)
        }
    }

    Chats.getChat = async function (members, req, callback) {
        let userId = req.accessToken.userId
        members.push(userId.toString());
        let chat;
        chat = await Chats.findOne({ "where": { "membersId": members } })
        if (chat == null) {
            let type = "chat";
            if (members.length > 2) {
                type = "groupe"
            }
            let newChat = await Chats.create({ "membersId": members });
            let membersArray = []
            members.forEach(element => {
                if (element != userId)
                    membersArray.push({ "userId": element, "chatId": newChat.id })
                else
                    membersArray.push({ "userId": userId, "chatId": newChat.id, "isAdmin": true })
            });
            await Chats.app.models.chatMembers.create(membersArray);
            chat = await Chats.findById(newChat.id)

        }
        callback(null, chat)
    }


    Chats.getMyChat = async function (filter = { "where": {}, "limit": 10, "offset": 0, "order": "lastMessageDate DESC" }, req, callback) {
        try {
            let userId = req.accessToken.userId;
            let chatMembers = await Chats.app.models.chatMembers.find({ "where": { "userId": userId, "isDeleted": false } })
            let chatsId = []
            chatMembers.forEach(element => {
                chatsId.push(element.chatId)
            });
            let chats = []
            if (chatsId.length != 0) {
                if (filter.where == null) {
                    filter.where = {}
                }
                filter.where['id'] = { "inq": chatsId }
                chats = await Chats.find(filter);
            }
            return callback(null, chats)
        }
        catch (error) {
            callback(error)
        }
    }

};

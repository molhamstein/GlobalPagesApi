'use strict';
var _userSocket = {};

module.exports = function (app) {
    // app.io = require('socket.io')(app.start());

    require('socketio-auth')(app.io,
        {
            authenticate: function (socket, value, callback) {
                var AccessToken = app.models.AccessToken;
                var token = AccessToken.find({
                    where: {
                        and: [{ userId: value.userId }, { id: value.id }]
                    }
                }, function (err, tokenDetail) {
                    if (err) throw err;
                    if (tokenDetail.length) {
                        app._userSocket[value.userId] = socket;
                        callback(null, true);
                    } else {
                        callback(null, false);
                    }
                });
            }
        }
    );

    app.io.on('connection', function (socket) {
        console.log('a user connected');
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
        // Send Message
        //data:any ={"text":"string","userId":"string","chatId":"string","media": {},}
        socket.on('send', async function (data) {
            // create new message
            let newMessage = await app.models.messages.create({ "text": data.text, "media": data.media, "chatId": data.chatId, "ownerId": data.userId });
            newMessage = await app.models.messages.findById(newMessage.id)
            // update lastMessage Seen for owner
            await app.models.chatMembers.updateAll({ "userId": data.userId, "chatId": data.chatId }, { "lastMessageSeen": newMessage.id });

            // update last message in chat
            let chat = await app.models.Chats.findById(newMessage.chatId)
            await chat.updateAttributes({ "lastMessageId": newMessage.id, "lastMessageDate": newMessage.creationDate })

            // get members in the chat
            let members = await app.models.chatMembers.find({ "where": { "chatId": data.chatId } })
            members.forEach(element => {
                if (app._userSocket[element.userId]) {
                    if (element.userId != data.userId) {

                        // plus one to unread message for all members in chat unless the owner
                        let oldUnreadMessageCount = element.unreadMessageCount + 1
                        element.updateAttribute("unreadMessageCount", oldUnreadMessageCount)
                    }

                    // send the message to all members in the chat
                    app._userSocket[element.userId].emit('reciveMessage', newMessage)
                }
                // }
            });
        })

        // User Typing 
        //data:any ={"userId":"string","chatId":"string","typing": "boolean"}
        socket.on('typing', async function (data) {

            // get members in the chat
            let members = await app.models.chatMembers.find({ "where": { "chatId": data.chatId } })
            members.forEach(element => {
                if (app._userSocket[element.userId] && element.userId != data.userId) {

                    // emit for all members in chat unless the user the user is typing
                    app._userSocket[element.userId].emit('typingMessage', data)
                }
            });
        })

        // user seen the messages
        //data:any ={"userId":"string","chatId":"string","messageId": "boolean"}
        socket.on('seen', async function (data) {
            // update user info 
            await app.models.chatMembers.updateAll({ "userId": data.userId, "chatId": data.chatId }, { "lastMessageSeen": data.messageId, "unreadMessageCount": 0 });

            // get members in the chat
            let members = await app.models.chatMembers.find({ "where": { "chatId": data.chatId } })
            members.forEach(element => {
                if (app._userSocket[element.userId] && element.userId != data.userId) {

                    // emit for all members in chat unless the user, the user is saw message
                    app._userSocket[element.userId].emit('seenMessage', data)
                }
            });
        })
    })

    // setTimeout(function () {
    //     for (const key in _userSocket) {
    //         if (_userSocket.hasOwnProperty(key)) {
    //             const element = _userSocket[key];
    //             console.log("ssssss")
    //             element.emit('test', "hi")

    //         }
    //     }
    // }, 25000)
}


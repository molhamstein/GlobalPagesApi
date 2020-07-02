'use strict';

module.exports = function (Chatmembers) {

    Chatmembers.observe('access', async function (ctx) {

        ctx.query = ctx.query || {};
        ctx.query.where = ctx.query.where || {};
        if (!ctx.query.where.isDeleted) {
            ctx.query.where.isDeleted = false;
        }
    });
};

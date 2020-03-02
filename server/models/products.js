'use strict';

module.exports = function (Products) {

    Products.once("attached", function () {


        Products.deleteById = async function (id, auth, cb) {


            let product = await Products.findById(id);
            if (!product)
                throw {
                    message: "Resource not found",
                    code: 404
                };


            product.updateAttribute("deleted", true);


            return "deleted";
        }


    });

    Products.observe('access', async function (ctx) {

        ctx.query = ctx.query || {};
        ctx.query.where = ctx.query.where || {};
        if (!ctx.query.where.deleted) {
            ctx.query.where.deleted = false;
        }
    });

};

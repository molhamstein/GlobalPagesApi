'use strict';
module.exports = function (Order) {

    Order.makeOrder = async function (productId, count, note, phone, address, req, callback) {
        try {
            let data = {}
            var product = await Order.app.models.marketProducts.findOne({ "where": { "id": productId } ,include:"business"});
            if (product == null || product.status != 'activated') {
                let err = new Error('Product not found');
                err.statusCode = 404;
                err.code = 'PRODUCT_NOT_FOUND';
                throw err
            }
            data = {
                ownerId: req.accessToken.userId,
                productId, priceProduct: product.price,
                count, note, phone, address,
                price: count * product.price,
                businessOwnerId: product.business ? product.business().ownerId : null,
                businessId: product.businessId
            }
            let order = await Order.create(data);
            callback(null, order);
        }
        catch (error) {
            callback(error)
        }
    }
    Order.remoteMethod('makeOrder', {
        description: 'Make Order',
        accepts: [
            {
                "arg": "productId",
                "type": "string",
                "required": true,
                "description": ""
            },
            {
                "arg": "count",
                "type": "number",
                "required": true,
                "description": ""
            },
            {
                "arg": "note",
                "type": "string",
                "required": false,
                "description": ""
            },
            {
                "arg": "phone",
                "type": "string",
                "required": true,
                "description": ""
            },
            {
                "arg": "address",
                "type": "string",
                "required": true,
                "description": ""
            },
            {
                arg: "req",
                type: "object",
                required: true,
                description: "",
                "http": {
                    "source": "req"
                }
            }
        ],
        returns: {
            "arg": "result",
            "type": "object",
            "root": true,
            "description": ""
        },
        http: {
            verb: 'post',
            path: '/makeOrder'
        },
    });



};

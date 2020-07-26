'use strict';
module.exports = function (Order) {

    Order.makeOrder = async function (productId, count, note, phone, address, ownerId, req, callback) {
        try {
            let data = {}
            var product = await Order.app.models.marketProducts.findOne({ "where": { "id": productId }, include: "business" });
            if (product == null || product.status != 'activated') {
                let err = new Error('Product not found');
                err.statusCode = 404;
                err.code = 'PRODUCT_NOT_FOUND';
                throw err
            }
            data = {
                ownerId: ownerId ? ownerId : req.accessToken.userId,
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
                "arg": "ownerId",
                "type": "string",
                "required": false,
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

    Order.updateOrder = async function (id, productId, count, note, phone, address, status, ownerId, req, callback) {
        try {
            let data = {}
            var mainOrder = await Order.findById(id)
            if (mainOrder == null) {
                let err = new Error('Order not found');
                err.statusCode = 404;
                err.code = 'ORDER_NOT_FOUND';
                throw err
            }
            var product = await Order.app.models.marketProducts.findOne({ "where": { "id": productId }, include: "business" });
            if (product == null || product.status != 'activated') {
                let err = new Error('Product not found');
                err.statusCode = 404;
                err.code = 'PRODUCT_NOT_FOUND';
                throw err
            }
            data = {
                productId, priceProduct: product.price,
                count, note, phone, address, status,
                price: count * product.price,
                businessOwnerId: product.business ? product.business().ownerId : null,
                businessId: product.businessId
            }
            if (ownerId) {
                data['ownerId'] = ownerId
            }
            let newOrder = await mainOrder.updateAttributes(data);
            callback(null, newOrder);
        }
        catch (error) {
            callback(error)
        }
    }
    Order.remoteMethod('updateOrder', {
        description: 'Update Order',
        accepts: [
            {
                "arg": "id",
                "type": "string",
                "required": true,
                "description": "",
                "http": {
                    "source": "path"
                }
            },
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
                "arg": "status",
                "type": "string",
                "required": true,
                "description": ""
            },
            {
                "arg": "ownerId",
                "type": "string",
                "required": false,
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
            verb: 'put',
            path: '/:id/updateOrder'
        },
    });



};

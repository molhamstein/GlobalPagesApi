'use strict';

module.exports = function (Products) {
  Products.addProduct = async function (categoryId, subCategoryId, cityId, locationId, titleEn, titleAr, descriptionEn, descriptionAr, price, status = "pending", tags = [], ownerId = null, media = [], businessId, req, callback) {

    // console.log(req)
    var userId = req.accessToken.userId
    if (ownerId != null)
      userId = ownerId;
    var objectProduct = {
      "ownerId": userId,
      "cityId": cityId,
      "locationId": locationId,
      "titleEn": titleEn,
      "titleAr": titleAr,
      "descriptionEn": descriptionEn,
      "descriptionAr": descriptionAr,
      "price": price,
      "status": status,
      "categoryId": categoryId,
      "subCategoryId": subCategoryId,
      "media": media,
      "businessId":businessId
    }

    var product = await Products.create(objectProduct);

    var mainTags = [];
    tags.forEach(element => {
      mainTags.push({
        "tagId": element,
        "productId": product.id
      })
    });

    await Products.app.models.productTags.create(mainTags)
    var newproduct = await Products.findById(product.id)
    callback(null, newproduct)
  }

  Products.remoteMethod('addProduct', {
    description: '',
    accepts: [{
        arg: "categoryId",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "subCategoryId",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "cityId",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "locationId",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "titleEn",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "titleAr",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "descriptionEn",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "descriptionAr",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "price",
        type: "number",
        required: false,
        description: ""
      },
      {
        arg: "status",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "tags",
        type: ["string"],
        required: false,
        description: ""
      },
      {
        arg: "ownerId",
        type: "string",
        required: false
      },
      {
        arg: "media",
        type: ["string"],
        required: false
      },
      {
        arg: "businessId",
        type: "string",
        required: false
      },
      {
        "arg": "req",
        "type": "object",
        "required": true,
        "description": "",
        "http": {
          "source": "req"
        }
      }
    ],
    returns: {
      arg: 'message',
      type: 'string',
      root: true
    },
    http: {
      verb: 'post',
      path: '/addProduct'
    },
  });

  Products.updateProduct = async function (id, categoryId, subCategoryId, cityId, locationId, titleEn, titleAr, descriptionEn, descriptionAr, price, status, tags, ownerId, media = [],businessId, callback) {
    var product = await Products.findById(id);
    if (product == null) {
      var err = new Error('product not found');
      err.statusCode = 404;
      err.code = 'PRODUCT_NOT_FOUND';
      return callback(err);
    }
    await Products.app.models.productTags.destroyAll({
      "productId": id
    })

    var mainTags = [];
    tags.forEach(element => {
      mainTags.push({
        "tagId": element,
        "productId": id
      })
    });
    var mainOwnerId = product.ownerId;
    if (ownerId)
      mainOwnerId = ownerId;

    await Products.app.models.productTags.create(mainTags)
    product = await product.updateAttributes({
      "ownerId": mainOwnerId,
      "titleEn": titleEn,
      "titleAr": titleAr,
      "descriptionEn": descriptionEn,
      "descriptionAr": descriptionAr,
      "cityId": cityId,
      "locationId": locationId,
      "price": price,
      "status": status || product.status,
      "categoryId": categoryId,
      "subCategoryId": subCategoryId,
      "media": media,
      "businessId":businessId
    })
    product = await Products.findById(id);
    callback(null, product);
  };


  Products.remoteMethod('updateProduct', {
    description: '',
    accepts: [{
        arg: 'id',
        type: 'string',
        required: true,
        http: {
          "source": "path"
        }
      },
      {
        arg: "categoryId",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "subCategoryId",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "cityId",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "locationId",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "titleEn",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "titleAr",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "descriptionEn",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "descriptionAr",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "price",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "status",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "tags",
        type: ["string"],
        required: false,
        description: ""
      },
      {
        arg: "ownerId",
        type: "string",
        required: false
      },
      {
        arg: "media",
        type: ["string"],
        required: false
      },
      {
        arg: "businessId",
        type: "string",
        required: false
      }
    ],
    returns: {
      arg: 'message',
      type: 'object',
      root: true
    },
    http: {
      verb: 'put',
      path: '/:id/updateProduct'
    },
  });


};

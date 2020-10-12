'use strict';

module.exports = function (Marketproducts) {
  Marketproducts.addProduct = async function (categoryId, subCategoryId, cityId, locationId, titleEn, titleAr, descriptionEn, descriptionAr, price, status = "pending", tags = [], ownerId = null, media = [], businessId, req, callback) {

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
      "businessId": businessId
    }
    var owner = await Marketproducts.app.models.User.findById(userId);
    let expireAutomaticApproveProduct = owner.expireAutomaticApproveProduct
    let countAutomaticApproveProduct = owner.countAutomaticApproveProduct
    let country = await owner.country.get();

    if ((expireAutomaticApproveProduct != null && expireAutomaticApproveProduct.getTime() > new Date().getTime() && countAutomaticApproveProduct > 0) || (country && country.isAllowedProduct)) {
      objectProduct.status = 'activated'
      if (expireAutomaticApproveProduct != null && expireAutomaticApproveProduct.getTime() > new Date().getTime() && countAutomaticApproveProduct > 0) {
        let newCountAutomaticApproveProduct = countAutomaticApproveProduct - 1
        await owner.updateAttribute('countAutomaticApproveProduct', newCountAutomaticApproveProduct)
      }
    }

    var product = await Marketproducts.create(objectProduct);


    var mainTags = [];
    tags.forEach(element => {
      mainTags.push({
        "tagId": element,
        "productId": product.id
      })
    });

    await Marketproducts.app.models.productTags.create(mainTags)
    var newproduct = await Marketproducts.findById(product.id)
    callback(null, newproduct)
  }

  Marketproducts.remoteMethod('addProduct', {
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

  Marketproducts.updateProduct = async function (id, categoryId, subCategoryId, cityId, locationId, titleEn, titleAr, descriptionEn, descriptionAr, price, status, tags = [], ownerId, media = [], businessId, callback) {
    var product = await Marketproducts.findById(id);
    if (product == null) {
      var err = new Error('product not found');
      err.statusCode = 404;
      err.code = 'PRODUCT_NOT_FOUND';
      return callback(err);
    }
    await Marketproducts.app.models.productTags.destroyAll({
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

    await Marketproducts.app.models.productTags.create(mainTags)
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
      "businessId": businessId
    })
    product = await Marketproducts.findById(id);
    callback(null, product);
  };


  Marketproducts.remoteMethod('updateProduct', {
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


  Marketproducts.rateProduct = async function (id, text, value, req, callback) {
    var product = await Marketproducts.findById(id);
    var userId = req.accessToken.userId
    if (product == null) {
      var err = new Error('product not found');
      err.statusCode = 404;
      err.code = 'PRODUCT_NOT_FOUND';
      return callback(err);
    }

    let hasRate = await Marketproducts.app.models.rating.findOne({ "where": { ownerId: userId, productId: id } })
    if (hasRate) {
      var err = new Error('has already rate');
      err.statusCode = 601;
      err.code = 'HAS_ALREADY_RATE';
      return callback(err);
    }

    let newRate = await Marketproducts.app.models.rating.create({ ownerId: userId, productId: id, text, value })
    let rateTotal = product.rateTotal + value;
    let countRate = product.countRate + 1;
    let rate = rateTotal / countRate;

    await product.updateAttributes({ rateTotal, countRate, rate })


    let business = await Marketproducts.app.models.Business.findById(product.businessId)
    let productRateTotal = business.productRateTotal + value;
    let productCountRate = business.productCountRate + 1;
    let productRate = productRateTotal / productCountRate;

    await business.updateAttributes({ productRateTotal, productCountRate, productRate })

    callback(null, newRate);
  };


  Marketproducts.remoteMethod('rateProduct', {
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
      arg: "text",
      type: "string",
      required: false,
      description: ""
    },
    {
      arg: "value",
      type: "number",
      required: true,
      description: ""
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
      path: '/:id/rateProduct'
    },
  });


  Marketproducts.plusProductviewsCount = function (productId, req, cb) {
    Marketproducts.findById(productId.toString(), {}, function (err, product) {
      if (err)
        return cb(err);
      if (!product) {
        err = new Error('Products not found');
        err.statusCode = 404;
        err.code = 'PRODUCT_NOT_FOUND';
        return cb(err);
      }
      if (req.accessToken && req.accessToken.userId) {
        var userId = req.accessToken.userId
        Marketproducts.app.models.userSeenProduct.findOne({ "where": { userId, "productId": product.id } }, function (err, data) {
          if (err)
            return cb(err);
          if (data == null)
            Marketproducts.app.models.userSeenProduct.create({ userId, "productId": product.id })
        })
      }

      product.viewsCount++;

      return product.save(cb)
    });
  }

  Marketproducts.remoteMethod('plusProductviewsCount', {
    description: 'plus +1 to viewsCount',
    accepts: [{ arg: 'productId', type: 'string', required: true }, {
      arg: "req",
      type: "object",
      required: true,
      description: "",
      "http": {
        "source": "req"
      }
    }],
    // returns: {arg: 'message', type: 'string'},
    http: { verb: 'post', path: '/:productId/productViewsCount' },
  });

};

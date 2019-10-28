'use strict';

module.exports = function (Usercv) {

  Usercv.updateMyCv = async function (education, experience, tags, bio, primaryIdentifier, cityId, githubLink = null, facebookLink = null, twitterLink = null, websiteLink = null, behanceLink = null, cvURL = null, imageProfile, phoneNumber, username, req, callback) {
    var userId = req.accessToken.userId
    let user = await Usercv.app.models.User.findById(userId);
    if (!user)
      throw ERROR(404, "User not found");
    var mainEducationArrayCV = []
    education.forEach(element => {
      if (element.title && element.educationalEntity && element.from && element.to && !isNaN(new Date(element.from).getTime()) && !isNaN(new Date(element.to).getTime())) {
        mainEducationArrayCV.push({
          "title": element.title,
          "educationalEntity": element.educationalEntity,
          "from": new Date(element.from),
          "to": new Date(element.to),
          "description": element.description
        })
      }
    });

    var mainExperienceArrayCV = [];
    experience.forEach(element => {
      if (element.title && element.companyName && element.isPresent != null && element.from && !isNaN(new Date(element.from).getTime()) && (element.isPresent == true || (element.to && !isNaN(new Date(element.to).getTime())))) {
        mainExperienceArrayCV.push({
          "title": element.title,
          "companyName": element.companyName,
          "from": new Date(element.from),
          "to": new Date(element.to),
          "isPresent": element.isPresent,
          "description": element.description
        })
      }
    });

    var cv = await Usercv.findOne({
      "userId": userId
    })
    if (cv == null) {
      cv = await Usercv.create({
        "userId": userId,
        "education": [{}],
        "experience": [{}],
      })
    }
    console.log("cv");
    console.log(cv);
    var mainTags = [];
    tags.forEach(element => {
      mainTags.push({
        "tagId": element,
        "userCvId": cv.id
      })
    });

    await Usercv.app.models.userTags.destroyAll({
      "userCvId": cv.id
    })

    await Usercv.app.models.userTags.create(mainTags)
    await cv.updateAttributes({
      "education": mainEducationArrayCV,
      "experience": mainExperienceArrayCV,
      "primaryIdentifier": primaryIdentifier,
      "bio": bio,
      "githubLink": githubLink,
      "facebookLink": facebookLink,
      "twitterLink": twitterLink,
      "websiteLink": websiteLink,
      "behanceLink": behanceLink,
      "cityId": cityId,
      "cvURL": cvURL
    })
    var newcv = await Usercv.findById(cv.id)
    if (username) {
      await user.updateAttributes({
        "phoneNumber": phoneNumber,
        "imageProfile": imageProfile,
        "username": username
      })
    }
    callback(null, newcv)
  }

  Usercv.remoteMethod('updateMyCv', {
    description: 'update my cv',
    accepts: [{
        "arg": "education",
        "type": ["object"],
        "required": false,
        "description": ""
      },
      {
        "arg": "experience",
        "type": ["object"],
        "required": false,
        "description": ""
      },
      {
        "arg": "tags",
        "type": ["string"],
        "required": false,
        "description": ""
      },
      {
        "arg": "bio",
        "type": "string",
        "required": false,
        "description": ""
      },
      {
        "arg": "primaryIdentifier",
        "type": "string",
        "required": false,
        "description": ""
      },
      {
        "arg": "cityId",
        "type": "string",
        "required": true,
        "description": ""
      },
      {
        "arg": "githubLink",
        "type": "string",
        "required": false,
        "description": ""
      },
      {
        "arg": "facebookLink",
        "type": "string",
        "required": false,
        "description": ""
      },
      {
        "arg": "twitterLink",
        "type": "string",
        "required": false,
        "description": ""
      },
      {
        "arg": "websiteLink",
        "type": "string",
        "required": false,
        "description": ""
      },
      {
        "arg": "behanceLink",
        "type": "string",
        "required": false,
        "description": ""
      },
      {
        "arg": "cvURL",
        "type": "string",
        "required": false,
        "description": ""
      },
      {
        "arg": "imageProfile",
        "type": "string",
        "required": false,
        "description": ""
      },
      {
        "arg": "phoneNumber",
        "type": "string",
        "required": false,
        "description": ""
      },
      {
        "arg": "username",
        "type": "string",
        "required": false,
        "description": ""
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
      root: true,
      type: 'object'
    },
    http: {
      verb: 'put',
      path: '/updateMyCv'
    },
  });




};

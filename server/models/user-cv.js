'use strict';

module.exports = function (Usercv) {

  Usercv.updateMyCv = async function (education, experience, tags, req, callback) {
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
      if (element.title && element.companyName && element.from && element.to && !isNaN(new Date(element.from).getTime()) && !isNaN(new Date(element.to).getTime())) {
        mainExperienceArrayCV.push({
          "title": element.title,
          "companyName": element.companyName,
          "from": new Date(element.from),
          "to": new Date(element.to),
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
      "experience": mainExperienceArrayCV
    })
    var newcv = await Usercv.findById(cv.id)
    callback(null, newcv)
  }

  Usercv.remoteMethod('updateMyCv', {
    description: 'update my cv',
    accepts: [{
        "arg": "education",
        "type": ["object"],
        "required": true,
        "description": ""
      },
      {
        "arg": "experience",
        "type": ["object"],
        "required": true,
        "description": ""
      },
      {
        "arg": "tags",
        "type": ["string"],
        "required": true,
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

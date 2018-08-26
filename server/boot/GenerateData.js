'use strict';

module.exports = function GenerateData(server) {
// users 
/******************************************************************************
// return;
******************************************************************************/
	var users = [
		{
		  "username": "ahmad ataya",
		  "email": "ahmad.3taya@gmail.com",
		  "password" : "qwe12345",
		  "birthDate": "2018-06-04T13:01:40.629Z",
		  "phoneNumber": "0936207611",
		  "gender": "male",
		  "emailVerified": true
		},
		{
		  "username": "anaas",
		  "email": "anas.alazmeh@gmail.com",
		  "password" : "qwe12345",
		  "birthDate": "2018-06-04T13:01:40.629Z",
		  "phoneNumber": "0936207614",
		  "gender": "male",
		  "emailVerified": true
		},
		{
		  "username": "molham",
		  "email": "molham.molham@gmail.com",
		  "password" : "qwe12345",
		  "birthDate": "2018-06-04T13:01:40.629Z",
		  "phoneNumber": "0936207611",
		  "gender": "male",
		  "emailVerified": true
		},
	]
createData('user',users,function(err,users){
	if(err)
		return console.log(err);
	var postCategories = [
		{
		  "titleEn": "cars for sale",
		  "titleAr": "سيارات للبيع"
		},
		{
		  "titleEn": "mobiles for sale",
		  "titleAr": "هواتف للبيع"
		},
		{
		  "titleEn": "lands",
		  "titleAr": "أراضي للبيع"
		}		
	]
	createData('postCategories',postCategories,function(err,categories){
		if(err)
			return console.log(err);
		var postChildCategories = [
			{
			  "titleEn": "BMW",
			  "titleAr": "BMW",
			  "parentCategoryId" : categories[0].id.toString()
			},
			{
			  "titleEn": "mercedes",
			  "titleAr": "مرسيدس",
			  "parentCategoryId" : categories[0].id.toString()
			},
			{
			  "titleEn": "iphone",
			  "titleAr": "iphone",
			  "parentCategoryId" : categories[1].id.toString()
			},
		];
		
		createData('postCategories',postChildCategories,function(err,childCategories){
			if(err)
				return console.log(err);

				createData('cities',cities,function(err,cities){
					if(err)
						return console.log(err);
					createData('locations',locations,function(err,locations){
						if(err)
							return console.log(err);

						var posts = [
							{
							  "title": "mercedes E350",
							  "description": "نضيفة خالية برا جوا زنار نضافة",
							  "status": "activated",
							  "viewsCount": 3,
							  "ownerId": users[0].id.toString(),
							  "categoryId": categories[0].id.toString(),
							  "subCategoryId": childCategories[1].id.toString(),
							  "cityId" : cities[0].id.toString(),
							  "locationId" : locations[0].id.toString(),
							  "media": [
									{
										"url": "104.217.253.15:3000/images/testImage1.jpg",
										"type": "image",
										"id": "1"
									},
									{
										"url": "104.217.253.15:3000/images/testImage2.jpg",
										"type": "image",
										"id": "2"
									}
								]
							},
							{
							  "title": "mercedes E650",
							  "description": "bla bla bla bla",
							  "status": "activated",
							  "image": "m1.jpg",
							  "viewsCount": 6,
							  "ownerId": users[0].id.toString(),
							  "categoryId": categories[0].id.toString(),
							  "subCategoryId": childCategories[1].id.toString(),
							  "cityId" : cities[0].id.toString(),
							  "locationId" : locations[1].id.toString(),
							  "media": [
									{
										"url": "104.217.253.15:3000/images/testImage1.jpg",
										"type": "image",
										"id": "1"
									}
								]
							},
							{
							  "title": "BMW x5",
							  "description": "bla bla bla bla",
							  "status": "activated",
							  "image": "m1.jpg",
							  "viewsCount": 12,
							  "ownerId": users[0].id.toString(),
							  "categoryId": categories[0].id.toString(),
							  "subCategoryId": childCategories[0].id.toString(),
							  "cityId" : cities[1].id.toString()
							},
							{
							  "title": "ipone X",
							  "description": "bla bla bla bla",
							  "status": "activated",
							  "image": "m1.jpg",
							  "viewsCount": 2,
							  "ownerId": users[0].id.toString(),
							  "categoryId": categories[1].id.toString(),
							  "subCategoryId": childCategories[2].id.toString(),
							  "cityId" : cities[0].id.toString(),
							  "locationId" : locations[2].id.toString(),
							  "media": [
									{
										"url": "104.217.253.15:3000/images/testImage1.jpg",
										"type": "image",
										"id": "1"
									}
								]
							},
							{
							  "title": "hwawei mate 10 lite",
							  "description": "bla bla bla bla",
							  "status": "activated",
							  "image": "m1.jpg",
							  "viewsCount": 0,
							  "ownerId": users[1].id.toString(),
							  "categoryId": categories[1].id.toString(),
							  "cityId" : cities[2].id.toString()
							}
						]

						createData('posts',posts,function(err,POSTS){
							if(err)
								return console.log(err);

							var volumes = [
								{
								  "titleEn": "Title Volume",
								  "titleAr": "المجلة الأسبوعية",
								  "status": "activated",
								  "postsIds": [
								    POSTS[0].id.toString(),
								    POSTS[1].id.toString(),
								    POSTS[2].id.toString(),
								    POSTS[3].id.toString(),
								    POSTS[4].id.toString()
								  ]
								}
							];
							createData('volumes',volumes,function(err,VOLUMES){
								if(err)
									return console.log(err);

								var businessCategories = [
									{
									  "titleEn": "Restaurants",
									  "titleAr": "bla bla"
									},
									{
									  "titleEn": "Medicine",
									  "titleAr": "bla bla"
									}	
								]
								createData('businessCategories',businessCategories,function(err,businessCategories){
									if(err)
										return console.log(err);
									var businesChildCategories = [
										{
										  "titleEn": "Eyes",
										  "titleAr": "bla bla",
										  "parentCategoryId" : businessCategories[1].id.toString()
										},
										{
										  "titleEn": "Plastic surgery",
										  "titleAr": "bla bla",
										  "parentCategoryId" : businessCategories[1].id.toString()
										},
										{
										  "titleEn": "caffe",
										  "titleAr": "bla bla",
										  "parentCategoryId" : businessCategories[0].id.toString()
										},
										{
										  "titleEn": "dinner",
										  "titleAr": "bla bla",
										  "parentCategoryId" : businessCategories[0].id.toString()
										},
										{
										  "titleEn": "fast food",
										  "titleAr": "bla bla",
										  "parentCategoryId" : businessCategories[0].id.toString()
										}
									];
									
									createData('businessCategories',businesChildCategories,function(err,businesChildCategories){
										if(err)
											return console.log(err);

									var business = [
										{
											"nameEn": "name",
											"nameAr": "bla bla",
											"logo": "logo.png",
											"cover": "m1.jpg",
											"status": "activated",
											"description": "bla bla bla bla bla bla bla bla bla ",
											"locationPoint" : {
												"lat": 12,
												"lng": 12
											},
											"openingDays": [
											1,2,5
											],
											"openingDaysEnabled": true,
											"ownerId": users[0].id.toString(),
											"products": products,
											"categoryId": businessCategories[0].id.toString(),
											"subCategoryId": businesChildCategories[0].id.toString(),
											"cityId": cities[0].id.toString(),
											"locationId": locations[0].id.toString()
										}
									];

									createData('business',business,function(err,business){
										if(err)
											return console.log(err);

										console.log("DONE");
									});
								});
							});

						});
					});
				});

			});

		});
	});
});




var cities = [
	{"nameAr" : "دمشق", "nameEn" : "Damas"},
	{"nameAr" : "حلب", "nameEn" : "Alepo"},
	{"nameAr" : "حمص", "nameEn" : "Homs"},
	{"nameAr" : "حماة", "nameEn" : "Hama"},
	{"nameAr" : "درعا", "nameEn" : "Daraa"}
];
var locations = [
	{"nameAr" : "مزة فيلات", "nameEn" : "Mazzeh Fillat"},
	{"nameAr" : "زاهرة جديدة", "nameEn" : "new Zahera"},
	{"nameAr" : "زاهرة قديمة ", "nameEn" : "old Zahera"}
];
var products = [
	{
		"name" : "name1",
		"price" : 100,
		"image": "m1.jpg"
	},
	{
		"name" : "name2",
		"price" : 99,
		"image": "m1.jpg"
	},
	{
		"name" : "name3",
		"price" : 50,
		"image": "m1.jpg"
	},

];



	

	function createData(modelName,data,cb){
		var cb1 = function(err, records) {
			if (err)
				return console.log(err);
			console.log('Done seeding data, '+records.length+' records in '+modelName+' created.');
		};
		if(!cb)
			cb = cb1;
		server.models[modelName].create(data,cb);

	}
};

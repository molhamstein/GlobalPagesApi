'use strict';
module.exports = async function (app) {
    // roles seed 
    let roles = [
        {
            "name": "Admin",
            "key": "admin",
            "privileges": [
                "*"
            ]
        },
        {
            "name": "User",
            "key": "user",
            "privileges": [
            ]
        },
        {
            "name": "Operator",
            "key": "operator",
            "privileges": [
                "eat-potato"
            ]
        }
    ];

    for (let role of roles) {
        await app.models.role.upsert( role);
    }


};
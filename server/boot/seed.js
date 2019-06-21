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
            ]
        }
    ];

    for (let role of roles) {
        await app.models.role.findOrCreate({ where: { key: role.key } }, role);
    }


};
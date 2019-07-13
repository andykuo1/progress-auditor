const User = require('./User.js');

const USER_KEY = 'user';

function setupDatabase(db)
{
    db[USER_KEY] = new Map();
    return db;
}

function addUser(db, userID, ownerKey, lastName, firstName, primaryEmail, otherEmails=[])
{
    const userMapping = db[USER_KEY];

    if (userMapping.has(userID))
    {
        throwError(db, 'Found duplicate user with id \'' + userID + '\'.');
    }
    else
    {
        // Create user...
        const user = User.createUser(userID, ownerKey, lastName, firstName, primaryEmail, otherEmails);
        userMapping.set(userID, user);
    }
}

module.exports = {
    USER_KEY,
    setupDatabase,
    addUser
};
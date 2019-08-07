import * as User from './User.js';

export const USER_KEY = 'user';
const OUTPUT_LOG = 'db.user.log';

export function setupDatabase(db)
{
    if (!(USER_KEY in db))
    {
        db[USER_KEY] = new Map();
    }
    return db;
}

export function addUser(db, userID, ownerKey, userName, attributes = {})
{
    const userMapping = db[USER_KEY];

    if (userMapping.has(userID))
    {
        db.throwError('Found duplicate user with id \'' + userID + '\'.');
        return null;
    }
    else
    {
        // Create user...
        const user = User.createUser(userID, ownerKey, userName, attributes);
        userMapping.set(userID, user);
        return user;
    }
}

export function getUsers(db)
{
    return db[USER_KEY].keys();
}

export function getUserByID(db, id)
{
    return db[USER_KEY].get(id);
}

export function getUserByOwnerKey(db, ownerKey)
{
    const userMapping = db[USER_KEY];
    for(const userData of userMapping.values())
    {
        if (Array.isArray(userData.ownerKey))
        {
            if (userData.ownerKey.includes(ownerKey))
            {
                return userData.id;
            }
        }
        else if (userData.ownerKey == ownerKey)
        {
            return userData.id;
        }
    }
    return null;
}

export function getUsersByAttribute(db, attributeName, attributeValue)
{
    let result = [];
    const userMapping = db[USER_KEY];
    for(const userData of userMapping.values())
    {
        if (attributeName in userData.attributes)
        {
            const attributeData = userData.attributes[attributeName];
            if (Array.isArray(attributeData))
            {
                if (attributeData.includes(attributeValue))
                {
                    result.push(userData.id);
                }
            }
            else if (attributeData == attributeValue)
            {
                result.push(userData.id);
            }
        }
        else if (attributeValue === null)
        {
            result.push(userData.id);
        }
    }
    return result;
}

export function outputLog(db, outputDir = '.')
{
    const userMapping = db[USER_KEY];
    const result = {};
    for(const [key, value] of userMapping.entries())
    {
        result[key] = value;
    }

    const header = `${'# '.repeat(20)}\n# Users\n# Size: ${userMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG), log);
}

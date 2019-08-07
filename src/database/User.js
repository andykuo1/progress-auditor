/**
 * Creates a user object.
 * @param {*} userID The globally unique user id.
 * @param {*} ownerKey The unique key, or keys, that associates submissions to users. Can be an array if associated with multiple.
 * @param {String} userName The user's name.
 * @param {Object} attributes Any additional information about the user.
 * @returns {Object} The user data object.
 */
export function createUser(userID, ownerKey, userName, attributes)
{
    return {
        id: userID,
        ownerKey,
        name: userName,
        attributes
    };
}

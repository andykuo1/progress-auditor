function createUser(userID, ownerKey, lastName, firstName, primaryEmail, otherEmails)
{
    return {
        id: userID,
        ownerKey,
        lastName,
        firstName,
        primaryEmail,
        otherEmails 
    };
}

module.exports = {
    createUser
};
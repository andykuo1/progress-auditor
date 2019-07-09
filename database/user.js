function createUser(userID, userName, userEmail)
{
    return {
        id: userID,
        name: userName,
        email: userEmail
    };
}

function addUser(db, user)
{
    if (db.user.has(user.id))
    {
        throw new Error(`Failed to add user - found duplicate user with id ${user.id}.`);
    }
    else
    {
        db.user.set(user.id, user);
    }
}

module.exports = {
    createUser,
    addUser
};
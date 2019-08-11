const { UserDatabase } = Library;

async function review(db, reviewID, reviewType, reviewParams)
{
    const user = UserDatabase.getUserByID(db, reviewParams[0]);
    if (!user)
    {
        db.throwError(`[INVALID_REVIEW_PARAM] Unable to find user for id '${reviewParams[0]}'.`);
        return;
    }

    if (Array.isArray(user.ownerKey))
    {
        user.ownerKey.push(reviewParams[1]);
    }
    else
    {
        user.ownerKey = [user.ownerKey, reviewParams[1]];
    }
}

module.exports = {
    review
};

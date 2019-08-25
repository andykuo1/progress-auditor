import * as UserDatabase from '../../../database/UserDatabase.js';

export const REVIEW_TYPE = 'add_owner_key';
export const REVIEW_DESC = 'Add additional owner key for user';
export const REVIEW_PARAM_TYPES = [
    'User ID',
    'Owner Key'
];

export async function review(db, reviewID, reviewType, reviewParams)
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

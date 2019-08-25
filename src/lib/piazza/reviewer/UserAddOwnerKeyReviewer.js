import * as UserDatabase from '../../../database/UserDatabase.js';

export const REVIEW_TYPE = 'add_owner_key';
export const REVIEW_DESC = 'Add additional owner key for user';
export const REVIEW_PARAM_TYPES = [
    'User ID',
    'Owner Key'
];

export async function review(db, reviewID, reviewType, reviewParams)
{
    if (reviewType !== REVIEW_TYPE) db.throwError(`Mismatched review type - '${REVIEW_TYPE}' reviewer cannot process review type '${reviewType}'.`);
    if (reviewParams.length < 2) db.throwError(`Missing review params - expected 2 parameter.`, { id: [reviewID, reviewType], options: [`Add more parameters to the review.`] });

    const user = UserDatabase.getUserByID(db, reviewParams[0]);
    if (!user)
    {
        db.throwError(`Invalid review param - Cannot find user for id '${reviewParams[0]}'.`, { id: [reviewID, reviewType], options: [`User with this id has probably already been removed.`, `Or the id is wrong.`] });
        return;
    }

    const ownerKey = reviewParams[1];
    if (user.ownerKey.includes(ownerKey))
    {
        db.throwError(`Invalid review param - Duplicate owner key '${ownerKey}' for user.`, { id: [reviewID, reviewType], options: [`The user already has this owner key.`] });
        return;
    }

    if (Array.isArray(user.ownerKey))
    {
        user.ownerKey.push(ownerKey);
    }
    else
    {
        user.ownerKey = [user.ownerKey, ownerKey];
    }
}

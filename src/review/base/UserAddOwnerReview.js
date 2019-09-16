import * as UserDatabase from '../../database/UserDatabase.js';

import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'add_owner_key';
export const DESCRIPTION = 'Add additional owner key for user.';

export async function review(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE)
            .paramLength(2)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const user = UserDatabase.getUserByID(db, params[0]);
                if (!user)
                {
                    db.throwError(ERROR_TAG, `Invalid review param - Cannot find user for id '${params[0]}'.`, {
                        id: [id, type],
                        options: [
                            `User with this id has probably already been removed.`,
                            `Or the id is wrong.`
                        ]
                    });
                    return;
                }
            
                const ownerKey = params[1];
                if (user.ownerKey.includes(ownerKey))
                {
                    db.throwError(ERROR_TAG, `Invalid review param - Duplicate owner key '${ownerKey}' for user.`, {
                        id: [id, type],
                        options: [`The user already has this owner key.`]
                    });
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
            })
            .review(db, config);
    }
    catch(e)
    {
        db.throwError(ERROR_TAG, e);
    }
}

export async function build()
{
    return await createBuilder()
        .type(TYPE)
        .param(0, 'User ID', 'The target user id to add the owner for.')
        .param(1, 'Ownewr Key', 'The new owner key to add for the user.')
        .build();
}

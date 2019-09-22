import * as UserDatabase from '../../database/UserDatabase.js';
import * as Client from '../../client/Client.js';

import * as Errors from '../helper/Errors.js';
import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

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
                    Errors.throwInvalidReviewParamUserIDError(db, value, params[0]);
                    return;
                }
            
                const ownerKey = params[1];
                if (user.ownerKey.includes(ownerKey))
                {
                    console.log("...Ignoring redundant review for owner key...");
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
        Client.error(e);
        throw e;
    }
}

export async function build(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep(error));
    }
    return result;
}

async function buildStep(error)
{
    return await createBuilder()
        .type(TYPE)
        .param(0, 'User ID', 'The target user id to add the owner for.')
        .param(1, 'Owner Key', 'The new owner key to add for the user.', error.context.ownerKey || '')
        .build();
}

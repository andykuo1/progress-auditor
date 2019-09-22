import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';

import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

export const TYPE = 'ignore_owner';
export const DESCRIPTION = 'Ignore all submissions for owner.';

export async function review(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE)
            .paramLength(1)
            .forEach(value =>
            {
                const { params } = value;
                SubmissionDatabase.clearSubmissionsByOwner(db, params[0]);
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
        .param(0, 'Owner Key', 'The target owner to ignore.', error.context.ownerKey || '')
        .build();
}

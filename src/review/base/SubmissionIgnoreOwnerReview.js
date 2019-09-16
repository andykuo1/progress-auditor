import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';

import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'ignore_owner';
export const DESCRIPTION = 'Ignore all submissions for owner.';

export async function review(db, config, reviewDatabase)
{
    try
    {
        await createReviewer(reviewDatabase)
            .type(TYPE)
            .paramLength(1)
            .forEach(value =>
            {
                const { params } = value;
                SubmissionDatabase.clearSubmissionsByOwner(db, params[0]);
            })
            .review();
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
        .param(0, 'Owner Key', 'The target owner to ignore.')
        .build();
}

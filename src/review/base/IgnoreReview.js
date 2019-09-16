import * as ReviewDatabase from '../../database/ReviewDatabase.js';

import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'ignore_review';
export const DESCRIPTION = 'Ignore another review (cannot ignore another ignore_review).';

/**
 * This is a reflection review, as in it reviews (action) reviews (object).
 * Therefore, it must run first. Please refer to VacationReview for specifics.
 */
export async function review(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE)
            .paramLength(1)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const reviewID = params[0];
                const review = ReviewDatabase.getReviewByID(db, reviewID);
                if (review.type === TYPE)
                {
                    throw new Error(`Invalid review target '${reviewID}' - cannot ignore another ignore_review type.`);
                }
                ReviewDatabase.removeReviewByID(db, reviewID);
            })
            .review(db, config);
    }
    catch(e)
    {
        db.throwError(ERROR_TAG, e);
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
        .param(0, 'Review ID', 'The target review to ignore.')
        .build();
}

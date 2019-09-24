import * as ReviewDatabase from '../../database/ReviewDatabase.js';

import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

export const TYPE = 'ignore_review';
export const DESCRIPTION = 'Ignore another review (cannot ignore another ignore_review).';

const IGNORE_SUFFIX = '#IGNORE';

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
                if (review.type.endsWith(IGNORE_SUFFIX)) continue;
                if (review.type === TYPE)
                {
                    throw new Error(`Invalid review target '${reviewID}' - cannot ignore another ignore_review type.`);
                }
                // NOTE: We should not REMOVE the old review, just in case we want to refer to it later.
                // This is important because, if removed, the old review will no longer be saved to file.
                // So just change the type instead.
                // ReviewDatabase.removeReviewByID(db, reviewID);
                review.type = review.type + IGNORE_SUFFIX;
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
        .param(0, 'Review ID', 'The target review to ignore.', error.context.reviewID || '')
        .build();
}

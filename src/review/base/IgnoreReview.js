import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'ignore_review';
export const DESCRIPTION = 'Ignore another review (cannot ignore another ignore_review).';

/**
 * This is a reflection review, as in it reviews (action) reviews (object).
 * Therefore, it must run first. Please refer to VacationReview for specifics.
 */
export async function review(db, config, reviewDatabase)
{
    try
    {
        await createReviewer(reviewDatabase)
            .type(TYPE)
            .paramLength(1)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const reviewID = params[0];
                const review = reviewDatabase.getReviewByID(db, reviewID);
                if (review.type === TYPE)
                {
                    throw new Error(`Invalid review target '${reviewID}' - cannot ignore another ignore_review type.`);
                }
                reviewDatabase.removeReviewByID(db, reviewID);
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
        .param(0, 'Owner Key', 'The target owner to add the submission for.')
        .param(1, 'Assignment ID', 'The submission\'s assignment ID.')
        .param(2, '[Submission Date]', 'An optional parameter for the date of the new submission.')
        .param(3, '[Submission Attributes]', 'An optional parameter object for additional attributes.')
        .build();
}

import * as ReviewRegistry from '../ReviewRegistry.js';
import * as ReviewDatabase from '../../database/ReviewDatabase.js';

/**
 * Assumes reviewers are already loaded.
 * @param {Database} db The database to review.
 * @param {Object} config The config.
 */
export async function processReviews(db, config)
{
    // Run the reviews...
    const reviewResults = [];
    for(const reviewID of ReviewDatabase.getReviews(db))
    {
        const review = ReviewDatabase.getReviewByID(db, reviewID);
        const reviewType = review.type;
        const reviewParams = review.params;

        const reviewer = ReviewRegistry.getReviewerByType(reviewType);
        reviewResults.push(reviewer.review(db, reviewID, reviewType, reviewParams));
    }

    return Promise.all(reviewResults);
}

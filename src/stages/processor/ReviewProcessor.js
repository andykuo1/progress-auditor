import * as ReviewDatabase from '../../database/ReviewDatabase.js';
import * as PiazzaReviewers from '../../lib/piazza/PiazzaReviewers.js';

/**
 * Assumes reviewers are already loaded.
 * @param {Database} db The database to review.
 * @param {Object} config The config.
 */
export async function processReviews(db, config)
{
    let reviewers;

    const scheme = config.scheme;
    switch(scheme)
    {
        case 'piazza':
            reviewers = PiazzaReviewers.REGISTRY;
            break;
        default:
            throw new Error('Unknown scheme');
    }

    // Run the reviews...
    const reviewResults = [];
    for(const reviewID of ReviewDatabase.getReviews(db))
    {
        const review = ReviewDatabase.getReviewByID(db, reviewID);
        const reviewType = review.type;
        const reviewParams = review.params;

        let reviewer;
        if (reviewers.has(reviewType))
        {
            reviewer = reviewers.get(reviewType);
        }
        else
        {
            reviewer = reviewers.get(NullReviewer.REVIEW_ID);
        }

        reviewResults.push(reviewer.review(db, reviewID, reviewType, reviewParams));
    }

    return Promise.all(reviewResults);
}

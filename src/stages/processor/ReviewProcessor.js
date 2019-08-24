import * as ReviewDatabase from '../../database/ReviewDatabase.js';

import * as NullReviewer from '../../lib/piazza/reviewer/NullReviewer.js';
import * as SubmissionChangeAssignmentReviewer from '../../lib/piazza/reviewer/SubmissionChangeAssignmentReviewer.js';
import * as SubmissionIgnoreOwnerReviewer from '../../lib/piazza/reviewer/SubmissionIgnoreOwnerReviewer.js';
import * as SubmissionIgnoreReviewer from '../../lib/piazza/reviewer/SubmissionIgnoreReviewer.js';
import * as UserAddOwnerKeyReviewer from '../../lib/piazza/reviewer/UserAddOwnerKeyReviewer.js';

/**
 * Assumes reviewers are already loaded.
 * @param {Database} db The database to review.
 * @param {Object} config The config.
 */
export async function processReviews(db, config)
{
    const reviewers = new Map();

    const scheme = config.scheme;
    switch(scheme)
    {
        case 'piazza':
            // TODO: This should be localized to the lib...
            reviewers.set(NullReviewer.REVIEW_ID, NullReviewer);
            reviewers.set(SubmissionChangeAssignmentReviewer.REVIEW_ID, SubmissionChangeAssignmentReviewer);
            reviewers.set(SubmissionIgnoreOwnerReviewer.REVIEW_ID, SubmissionIgnoreOwnerReviewer);
            reviewers.set(SubmissionIgnoreReviewer.REVIEW_ID, SubmissionIgnoreReviewer);
            reviewers.set(UserAddOwnerKeyReviewer.REVIEW_ID, UserAddOwnerKeyReviewer);
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

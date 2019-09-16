import ReviewRegistry from '../../review/ReviewRegistry.js';
import * as ReviewDatabase from '../../database/ReviewDatabase.js';

import * as PiazzaScheme from '../../review/piazza/PiazzaScheme.js';

export async function prepareDatabaseForScheme(db, config, schemeName = config.scheme)
{
    if (!schemeName) throw new Error('Missing \'scheme\' from config.');
    switch(schemeName)
    {
        case PiazzaScheme.SCHEME_NAME:
            await PiazzaScheme.setup(db, config, ReviewRegistry);
            break;
        default:
            throw new Error(`Unknown scheme by name '${schemeName}'.`);
    }
}

export function getSchemeNames()
{
    return [
        PiazzaScheme.SCHEME_NAME
    ];
}

export async function populateDatabaseWithAdditionalReviews(db, config, reviews)
{
    for(const review of reviews)
    {
        ReviewDatabase.addReview(db, ...review);
    }
}

/** This is used, alongside DatabaseHandler.populateDatabaseWithInputs(), in both the input and validation stage. */
export async function fixDatabaseWithReviews(db, config)
{
    console.log('...Reviewing our work...');
    await ReviewRegistry.applyReviews(db, config, db[ReviewDatabase.REVIEW_KEY]);

    /*
    // Review data...
    for(const reviewID of ReviewDatabase.getReviews(db))
    {
        const review = ReviewDatabase.getReviewByID(db, reviewID);
        const reviewType = review.type;
        const reviewParams = review.params;

        const reviewer = ReviewRegistry.getReviewerByType(reviewType);
        await reviewer.review(db, config, reviewID, reviewType, reviewParams);
    }

    console.log('...Helping you resolve a few things...');
    
    // Resolve data...
    const resolvers = ResolverRegistry.getResolvers();
    for(const resolver of resolvers)
    {
        await resolver.resolve(db, config);
    }
    */
}
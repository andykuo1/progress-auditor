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
        const { id, date, comment, type, params } = review;
        ReviewDatabase.addReview(db, id, date, comment, type, params);
    }
}

/** This is used, alongside DatabaseHandler.populateDatabaseWithInputs(), in both the input and validation stage. */
export async function fixDatabaseWithReviews(db, config)
{
    console.log('...Reviewing our work...');
    await ReviewRegistry.applyReviews(db, config, db[ReviewDatabase.REVIEW_KEY]);
}
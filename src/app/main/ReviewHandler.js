import ReviewRegistry from '../../review/ReviewRegistry.js';
import * as ReviewDatabase from '../../database/ReviewDatabase.js';
import * as SkipErrorReview from '../../review/base/SkipErrorReview.js';

import * as ClientHandler from '../client/ClientHandler.js';
import * as ReviewOutput from '../../output/ReviewOutput.js';
import * as DateUtil from '../../util/DateUtil.js';

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
    
    // NOTE: This needs to be ALWAYS applied last, because errors can be generated
    // from other reviews. This let's you skip them.
    await SkipErrorReview.review(db, config, db[ReviewDatabase.REVIEW_KEY]);
}

export async function shouldSaveReviewsForClient(db, config, reviews)
{
    if (!reviews || reviews.length <= 0) return false;

    const result = await ClientHandler.askWhetherToSaveNewReviews(db, config, reviews);
    if (!result)
    {
        console.log('...Dumping reviews...');
    }
    return result;
}

/**
 * Writes all current database reviews to file.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
export async function outputReviewsToFile(db, config)
{
    const path = require('path');
    let outputFilePath;
    if (config.outputAutoDate && db)
    {
        outputFilePath = path.resolve(config.outputPath + '/' + DateUtil.stringify(db.currentDate, false), 'reviews.csv');
    }
    else
    {
        outputFilePath = path.resolve(config.outputPath, `reviews-${DateUtil.stringify(new Date(Date.now()), true)}.csv`);
    }
    
    await ReviewOutput.output(db, config, outputFilePath, {});
}

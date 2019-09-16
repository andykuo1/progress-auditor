import ReviewRegistry from '../../review/ReviewRegistry.js';
import * as ReviewDatabase from '../../database/ReviewDatabase.js';
import * as SkipErrorReview from '../../review/base/SkipErrorReview.js';

import * as ClientHandler from '../client/ClientHandler.js';
import * as DateUtil from '../../util/DateUtil.js';
import * as FileUtil from '../../util/FileUtil.js';

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

export async function shouldSaveNewReviewsForClient(db, config, reviews)
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
 * Writes the reviews to file. If no reviews are passed-in, it will output the entire reviews database.
 * @param {Database} db The database.
 * @param {Config} config The config.
 * @param {Array<Array>} [reviews] An array of new reviews.
 */
export async function outputNewReviewsToFile(db, config, reviews = null)
{
    const path = require('path');
    
    const reviewTableHeader = [
        'Review ID',
        'Date',
        'Comment',
        'Type',
        'Param[0]',
        'Param[1]',
        'Param[2]',
        'Param[3]',
        '...'
    ];
    const reviewTable = [reviewTableHeader];

    if (!reviews)
    {
        // Append ALL reviews (including new ones)
        for(const reviewID of ReviewDatabase.getReviews(db))
        {
            const review = ReviewDatabase.getReviewByID(db, reviewID);
            const reviewEntry = [];

            // Don't save skip errors...
            if (review.type === SkipErrorReview.TYPE) continue;

            // ID
            reviewEntry.push(reviewID);
            // Date
            reviewEntry.push(DateUtil.stringify(review.date));
            // Comment
            reviewEntry.push(review.comment);
            // Type
            reviewEntry.push(review.type);
            // Params
            reviewEntry.push(...review.params);
            reviewTable.push(reviewEntry);
        }
    }
    else
    {
        // Append only NEW reviews
        for(const review of reviews)
        {
            const reviewEntry = [];
            // ID
            reviewEntry.push(review[0]);
            // Date
            reviewEntry.push(review[1]);
            // Comment
            reviewEntry.push(review[2]);
            // Type
            reviewEntry.push(review[3]);
            // Params
            reviewEntry.push(...review[4]);
            reviewTable.push(reviewEntry);
        }
    }

    const outputFilePath = path.resolve(config.outputPath, `reviews-${DateUtil.stringify(new Date(Date.now()), false)}.csv`);
    await FileUtil.writeTableToCSV(outputFilePath, reviewTable);
}

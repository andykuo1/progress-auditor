import * as DatabaseSetup from '../../database/DatabaseSetup.js';
import * as ClientHandler from '../client/ClientHandler.js';
import * as OutputHandler from '../main/OutputHandler.js';
import * as FileUtil from '../../util/FileUtil.js';
import * as DateUtil from '../../util/DateUtil.js';

import * as ReviewDatabase from '../../database/ReviewDatabase.js';

import * as ErrorReviewer from '../client/menu/ErrorReviewer.js';

/** If unable to find errors, an empty array is returned. */
export async function findDatabaseErrors(db, config)
{
    console.log("...Finding database errors...");

    const result = db.getErrors();
    if (!result || result.length <= 0)
    {
        await ClientHandler.celebrateNoErrors();
        return null;
    }
    else
    {
        return result;
    }
}

export async function shouldContinueResolvingErrorsWithClient(db, config, errors)
{
    return ClientHandler.askWhetherToReviewErrors(db, config, errors);
}

export async function resolveDatabaseErrors(db, config, errors)
{
    console.log("...Resolving database errors...");

    // TODO: This should be directed to ReviewResolver in the future.
    return await ErrorReviewer.resolveErrors(errors);
}

export async function clearDatabase(db, config)
{
    console.log("...Clearing database...");
    DatabaseSetup.clearDatabase(db, config);
}

export async function verifyErrorsWithClient(db, config, errors)
{
    if (!errors || errors.length <= 0) return true;
    
    return await ClientHandler.askWhetherToIgnoreErrors(db, config, errors);
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

    if (reviews)
    {
        // Append ALL reviews (including new ones)
        for(const reviewID of ReviewDatabase.getReviews(db))
        {
            const review = ReviewDatabase.getReviewByID(db, reviewID);
            const reviewEntry = [];
            if (review.type === '__temp__') continue;

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

export async function outputErrorLog(db, config, errors)
{
    console.log("...Outputting database errors...");
    
    // This will also output the error log...
    await OutputHandler.outputDebugLog(db, config);
}
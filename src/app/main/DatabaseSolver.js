import * as DatabaseSetup from '../../database/DatabaseSetup.js';
import * as ClientHandler from '../ClientHandler.js';
import * as FileUtil from '../../util/FileUtil.js';

import * as ErrorReviewer from './ErrorReviewer.js';
import * as Menu from '../client/menu/Menu.js';

/** If unable to find errors, an empty array is returned. */
export async function findDatabaseErrors(db, config)
{
    console.log("...Finding database errors...");
    const result = db.getErrors();
    if (!result || result.length <= 0)
    {
        Menu.println("== No errors! Hooray! ==");
        return null;
    }
    else
    {
        return result;
    }
}

export async function shouldContinueResolvingErrorsWithClient(db, config, errors)
{
    console.log("...Should resolve database errors?");
    return ClientHandler.askWhetherToReviewErrors(db, config, errors);
}

export async function resolveDatabaseErrors(db, config, errors)
{
    console.log("...Resolving database errors...");

    const errorID = await ErrorReviewer.askClientToPickError(errors);

    if (await ErrorReviewer.askClientToReviewError(db, errorID))
    {
        return await ErrorReviewer.doReviewSession(db, config);
    }

    return null;
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
    if (!result) Menu.println("Dumping reviews...");
    return result;
}

export async function outputNewReviewsToFile(db, config, reviews)
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

    const outputFilePath = path.resolve(config.outputPath, `reviews-${db.currentDate.toISOString()}.csv`);
    await FileUtil.writeTableToCSV(outputFilePath, reviewTable);
}

export async function outputErrorLog(db, config, errors)
{
    console.log("...Outputting database errors...");
}
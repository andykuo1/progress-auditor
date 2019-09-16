import * as DatabaseSetup from '../../database/DatabaseSetup.js';
import * as ClientHandler from '../client/ClientHandler.js';
import * as OutputHandler from '../main/OutputHandler.js';

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

export async function outputErrorLog(db, config, errors)
{
    console.log("...Outputting database errors...");
    
    // This will also output the error log...
    await OutputHandler.outputDebugLog(db, config);
}
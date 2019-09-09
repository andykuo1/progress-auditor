import * as Menu from './menu/Menu.js';
import * as ErrorReviewer from './menu/ErrorReviewer.js';

import * as DatabaseHandler from '../main/DatabaseHandler.js';
import * as OutputHandler from '../main/OutputHandler.js';
import * as SchemeHandler from './SchemeHandler.js';
import * as ReviewHandler from './ReviewHandler.js';
import * as ClientHandler from '../ClientHandler.js';

const path = require('path');

export async function onStart(args)
{
    Menu.printTitle();
    Menu.println();

    Menu.println("Running from directory:", path.resolve('.'));
    Menu.println();
}

export async function onSetup(db, config)
{
    /**
     * Loading - Where all data should be loaded from file. This
     * should be raw data as defined by the user. No modifications
     * should take place; they will be considered for alterations
     * in the processing stage.
     */

    // Prepare registries from scheme...
    await SchemeHandler.prepareScheme(db, config);

    Menu.println("Date:", db.currentDate.toDateString());
    Menu.println();
}

export async function onPreProcess(db, config)
{
    /**
     * Processing - Where all data is evaluated and processed into
     * valid and useful information. This is also where most of the
     * errors not related to IO will be thrown. This stage consists
     * of two steps: the review and the resolution. The resolution
     * step will attempt to automatically format and validate the
     * data. If it is unable to then the data is invalid and is
     * flagged for review by the user. Therefore, the review step,
     * which processes all user-created reviews, is computed before
     * the resolution. This is a frequent debug loop.
     */
    
    await runProcessors(db, config, false);
    
    // Review resolution loop
    const reviews = await ErrorReviewer.run(db, config, runProcessors);

    if (await ClientHandler.askWhetherToSaveNewReviews(db, config, reviews))
    {
        await ReviewHandler.saveReviewsToFile(db, config, reviews);
    }
    else
    {
        Menu.println("Dumping reviews...");
    }
}

export async function onPostProcess(db, config)
{

}

export async function onOutput(db, config)
{
    /**
     * Outputting - Where all data is outputted into relevant
     * files. If any errors had occured, it will exit-early and
     * output any gathered debug information.
     */
}

export async function onError(db, config, error)
{
    Menu.printlnError(error);

    await OutputHandler.outputDebugLog(db, config);
}

export async function onStop(db, config)
{

}

async function runProcessors(db, config, populate = true)
{
    if (populate)
    {
        Menu.println("...Processing...");
        Menu.println("Parsing databases...");
        await DatabaseHandler.populateDatabaseWithInputs(db, config);
    }

    await ReviewHandler.reviewDatabase(db, config);
    Menu.println();
}


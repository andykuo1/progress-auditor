import * as Menu from './menu/Menu.js';
import * as ErrorReviewer from './menu/ErrorReviewer.js';

import * as PiazzaScheme from '../piazza/PiazzaScheme.js';

import * as DatabaseHandler from '../main/DatabaseHandler.js';
import * as OutputHandler from '../main/OutputHandler.js';

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
    // Prepare registries from scheme...
    // NOTE: Any new schemes should be added to prepareScheme().
    await prepareScheme(db, config);

    Menu.println("Date:", db.currentDate.toDateString());
    Menu.println();
}

export async function onPreProcess(db, config)
{
    await runProcessors(db, config, false);
    
    // Review resolution loop
    const reviews = await ErrorReviewer.run(db, config, runProcessors);

    if (reviews.length > 0)
    {
        if (await Menu.askYesNo("Do you want to save the new reviews?"))
        {
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
            await FileUtil.writeTableToCSV(path.resolve(config.outputPath, `reviews-${db.currentDate.toISOString()}.csv`), reviewTable);
        }
        else
        {
            Menu.println("Dumping reviews...");
        }
    }

    // await runOutputs(db, config);

    console.log("......Stopped.");
    console.log();
}

export async function onPostProcess(db, config)
{

}

export async function onOutput(db, config)
{

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

    Menu.println("Evaluating reviews...");
    console.log('......Looking over our work...');
    await processReviews(db, config);

    Menu.println("Resolving database...");
    console.log(`......Helping you fix a few things...`);
    await processDatabase(db, config);

    Menu.println();
}

// NOTE: Any new schemes should be imported here AND added to prepareScheme().
export async function prepareScheme(db, config)
{
    const schemeName = config.scheme;
    if (!schemeName) throw new Error('Missing \'scheme\' name from config.');
    switch(schemeName)
    {
        case PiazzaScheme.SCHEME_NAME:
            PiazzaScheme.setup(db, config);
            break;
        default:
            throw new Error(`Unknown scheme by name '${schemeName}'.`);
    }
}

import * as ReviewRegistry from '../../review/ReviewRegistry.js';
import * as ReviewDatabase from '../../database/ReviewDatabase.js';

/**
 * Assumes reviewers are already loaded.
 * @param {Database} db The database to review.
 * @param {Object} config The config.
 */
export async function processReviews(db, config)
{
    // Run the reviews...
    const reviewResults = [];
    for(const reviewID of ReviewDatabase.getReviews(db))
    {
        const review = ReviewDatabase.getReviewByID(db, reviewID);
        const reviewType = review.type;
        const reviewParams = review.params;

        const reviewer = ReviewRegistry.getReviewerByType(reviewType);
        reviewResults.push(reviewer.review(db, reviewID, reviewType, reviewParams));
    }

    return Promise.all(reviewResults);
}

import * as ProcessorPipeline from '../../review/ProcessorPipeline.js';

/**
 * Assumes processors have already been registered.
 * @param {Database} db The database to resolve data for.
 * @param {Object} config The config.
 */
export async function processDatabase(db, config)
{
    // Resolve database...
    const processors = ProcessorPipeline.getProcessors('post');
    const results = [];
    for(const processor of processors)
    {
        console.log(`.........Resolving with '${processor}'...`);
        results.push(processor.resolve(db));
    }
    return Promise.all(results);
}

import * as InstructorReportOutput from '../../output/InstructorReportOutput.js';
import * as StudentReportOutput from '../../output/StudentReportOutput.js';

export async function processOutput(db, config)
{
    // Process outputs...
    console.log("......Generating reports for you...");

    const opts = {};
    //console.log(`.........Outputting with '${path.basename(outputConfig.filePath)}'...`);
    return Promise.all([
        InstructorReportOutput.output(db, config.outputPath, opts),
        StudentReportOutput.output(db, config.outputPath, opts),
    ]);
}


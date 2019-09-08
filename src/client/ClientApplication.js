import * as Menu from '../menu/Menu.js';
import * as ErrorReviewer from '../menu/ErrorReviewer.js';
import * as PiazzaScheme from '../lib/piazza/PiazzaScheme.js';

import * as AssignerLoader from '../assignment/AssignerLoader.js';

const path = require('path');

export async function onStart(args)
{
    Menu.printTitle();
    Menu.println();
}

export async function onSetup(db, config)
{
    // Prepare registries from scheme...
    // NOTE: Any new schemes should be added to prepareScheme().
    await prepareScheme(db, config);
    // await AssignerLoader.loadAssigners(db, config);
}

export async function onPreProcess(db, config)
{
    Menu.println("Assigning assignments...");
    await processAssignments(db, config);

    Menu.println("Evaluating reviews...");
    console.log('......Looking over our work...');
    await processReviews(db, config);

    Menu.println("Resolving database...");
    console.log(`......Helping you fix a few things...`);
    await processDatabase(db, config);

    Menu.println();
}

export async function onPostProcess(db, config)
{

}

export async function onPreOutput(db, config)
{

}

export async function onPostOutput(db, config)
{

}

export async function onError(db, config, error)
{
    Menu.printlnError(error);
    process.exit(1);
}

export async function onStop(db, config)
{

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

import * as ReviewRegistry from '../review/ReviewRegistry.js';
import * as ReviewDatabase from '../database/ReviewDatabase.js';

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

import * as ProcessorPipeline from '../review/ProcessorPipeline.js';

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
        // console.log(`.........Resolving with '${path.basename(resolverConfig.filePath)}'...`);
        results.push(processor.resolve(db));
    }
    return Promise.all(results);
}

import * as UserDatabase from '../database/UserDatabase.js';

/**
 * Assumes assigners have already been loaded.
 * @param {Database} db The database to load data into.
 * @param {Object} config The config.
 */
export async function processAssignments(db, config)
{
    const registry = db._registry;
    if (!('assigners' in registry) || !Array.isArray(registry.assigners))
    {
        return Promise.resolve([]);
    }

    // Create assignments...
    const assignmentResults = [];
    for(const assignerEntry of registry.assigners)
    {
        const [assignment, filePath, name, opts] = assignerEntry;
        console.log(`......Assigning '${path.basename(name)}' with '${path.basename(filePath)}'...`);

        for(const userID of UserDatabase.getUsers(db))
        {
            const user = UserDatabase.getUserByID(db, userID);
            const schedule = user.schedule;
            assignmentResults.push(assignment.assign(db, name, userID, schedule, opts));
        }
    }

    return Promise.all(assignmentResults);
}

import * as InstructorReportOutput from '../output/InstructorReportOutput.js';
import * as StudentReportOutput from '../output/StudentReportOutput.js';

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

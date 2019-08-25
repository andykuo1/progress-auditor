// database
import * as Assignment from './database/Assignment.js';
import * as AssignmentDatabase from './database/AssignmentDatabase.js';
import * as Database from './database/Database.js';
import * as Review from './database/Review.js';
import * as ReviewDatabase from './database/ReviewDatabase.js';
import * as Schedule from './database/Schedule.js';
import * as Submission from './database/Submission.js';
import * as SubmissionDatabase from './database/SubmissionDatabase.js';
import * as User from './database/User.js';
import * as UserDatabase from './database/UserDatabase.js';
import * as Vacation from './database/Vacation.js';
import * as VacationDatabase from './database/VacationDatabase.js';
const DATABASE_EXPORTS = {
    Assignment,
    AssignmentDatabase,
    Database,
    Review,
    ReviewDatabase,
    Schedule,
    Submission,
    SubmissionDatabase,
    User,
    UserDatabase,
    Vacation,
    VacationDatabase
};

// pipeline
import * as ConfigLoader from './stages/loader/ConfigLoader.js';
import * as DatabaseSetup from './stages/setup/DatabaseSetup.js';

import * as ParserLoader from './stages/loader/ParserLoader.js';
import * as AssignerLoader from './stages/loader/AssignerLoader.js';

import * as InputProcessor from './stages/processor/InputProcessor.js';
import * as AssignmentProcessor from './stages/processor/AssignmentProcessor.js';
import * as ReviewProcessor from './stages/processor/ReviewProcessor.js';
import * as PostProcessor from './stages/processor/PostProcessor.js';
import * as OutputProcessor from './stages/processor/OutputProcessor.js';

const PIPELINE_EXPORTS = {
    ConfigLoader,
    DatabaseSetup,

    ParserLoader,
    AssignerLoader,

    InputProcessor,
    AssignmentProcessor,
    ReviewProcessor,
    PostProcessor,
    OutputProcessor,
};

// util
import * as DateUtil from './util/DateUtil.js';
import * as FieldParser from './util/FieldParser.js';
import * as FileUtil from './util/FileUtil.js';
import * as MathHelper from './util/MathHelper.js';
import * as ParseUtil from './util/ParseUtil.js';
import TableBuilder from './util/TableBuilder.js';
const UTIL_EXPORTS = {
    DateUtil,
    FieldParser,
    FileUtil,
    MathHelper,
    ParseUtil,
    TableBuilder
};

// lib
import * as DebugInfoOutput from './lib/output/DebugInfoOutput.js';
import * as AssignmentGenerator from './lib/AssignmentGenerator.js';
const LIB_EXPORTS = {
    DebugInfoOutput,
    AssignmentGenerator
};

export const Library = {
    ...DATABASE_EXPORTS,
    ...PIPELINE_EXPORTS,
    ...UTIL_EXPORTS,
    ...LIB_EXPORTS
};

import { loadConfig } from './stages/loader/ConfigLoader.js';
import { setupDatabase, clearDatabase } from './stages/setup/DatabaseSetup.js';
import { loadParsers } from './stages/loader/ParserLoader.js';
import { loadAssigners } from './stages/loader/AssignerLoader.js';

// NOTE: Any new schemes should be imported here AND added to prepareScheme().
import * as PiazzaScheme from './lib/piazza/PiazzaScheme.js';

// import chalk from 'chalk';
import * as Menu from './menu/Menu.js';
// import * as DatabaseViewer from './menu/DatabaseViewer.js';
// import * as ReviewMaker from './menu/ReviewMaker.js';

// TODO: Config properties that only require filePath should accept strings as well.
// TODO: If files like vacations.csv or reviews.csv does not exist, it should not try to process them.

export async function run()
{
    Menu.printTitle();
    Menu.println();

    /**
     * Setup - Where all resources that loaders require to import
     * should be initialized.
     */
    const config = await prepareConfig();

    // Prepare global environment for external scripts...
    global.Library = Library;

    // Prepare database from config...
    const db = await prepareDatabase(config);

    // Prepare registries from scheme...
    // NOTE: Any new schemes should be added to prepareScheme().
    await prepareScheme(db, config);

    /**
     * Loading - Where all data should be loaded from file. This
     * should be raw data as defined by the user. No modifications
     * should take place; they will be considered for alterations
     * in the processing stage.
     */
    await runLoaders(db, config);

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
    await runProcessors(db, config);

    // TEST
    // await ReviewMaker.run(db, config);

    // Review resolution loop
    while (db._errors.length > 0)
    {
        Menu.println(`Found ${db._errors.length} errors. :(`);
        const answer = await Menu.askYesNo("Do you want to review them now?");
        if (answer)
        {
            // Review each error...
            for(const error of db._errors)
            {

            }
            
            Menu.printError(db._errors);

            // Restart the database...
            await clearDatabase(db, config);

            // Add the review to the database...
            // db, reviewID, reviewDate, comment, type, params
            // ReviewDatabase.addReview(db, MathHelper.uuid(), new Date(Date.now()), "Reviewed from program.", type, params);

            // Re-run the process again for new errors...
            await runProcessors(db, config);
        }
        else
        {
            Menu.println("Skipping errors...");
            break;
        }
    }

    /**
     * Outputting - Where all data is outputted into relevant
     * files. If any errors had occured, it will exit-early and
     * output any gathered debug information.
     */
    await runOutputs(db, config);

    /**
     * Cleanup - Where all resources are destroyed, just to make
     * sure nothing leaks.
     */
    console.log("......Stopped.");
    console.log();

    // process.exit(0);
}

async function prepareConfig()
{
    const path = require('path');
    Menu.println("Running from directory:", path.resolve('.'));
    Menu.println();

    Menu.println("Getting config file...");
    let configPath = null;
    if (process.argv.length > 2)
    {
        path.resolve(path.dirname(process.execPath), process.argv[2]);
    }
    else
    {
        Menu.println("...no config specified...");
        Menu.println("...getting default config...");
        configPath = './config.json';
    }

    Menu.println(`Loading config file '${configPath}'...`);
    let config = null;
    try
    {
        config = await loadConfig(configPath);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }
    Menu.println();
    return config;
}

async function prepareDatabase(config)
{
    Menu.println("Setting up the database...");
    let db = null;
    try
    {
        db = await setupDatabase(config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }
    Menu.println();

    Menu.println("Date:", db.currentDate.toDateString());
    Menu.println();

    return db;
}

async function prepareScheme(db, config)
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

async function runLoaders(db, config)
{
    Menu.println("Loading parsers...");
    try
    {
        await loadParsers(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }

    Menu.println("Loading assigners...");
    try
    {
        await loadAssigners(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }

    Menu.println();
}

async function runProcessors(db, config)
{
    Menu.println("...Processing...");

    Menu.println("Parsing databases...");

    try
    {
        await InputProcessor.processInputs(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }

    Menu.println("Assigning assignments...");
    try
    {
        await AssignmentProcessor.processAssignments(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }

    Menu.println("Evaluating reviews...");
    console.log('......Looking over our work...');
    try
    {
        await ReviewProcessor.processReviews(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }

    Menu.println("Resolving database...");
    console.log(`......Helping you fix a few things...`);
    try
    {
        await PostProcessor.processDatabase(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }

    Menu.println();
}

async function runOutputs(db, config)
{
    console.log("...Outputting...");
    if (db.getErrors().length > 0)
    {
        console.log("......Oh no! We found some errors...");
        console.log("......Finding debug info for you...");
        await DebugInfoOutput.output(db, config.outputPath, config);

        console.log("...Failed!");
        console.log();

        Menu.printMotivation();
        console.log();
    }
    else
    {
        console.log("......Hooray! Everything is as expected...");

        if (config.debug)
        {
            console.log("......Finding debug info for you...");
            await DebugInfoOutput.output(db, config.outputPath, config);
        }

        await OutputProcessor.processOutput(db, config);

        console.log("...Success!");
    }
}

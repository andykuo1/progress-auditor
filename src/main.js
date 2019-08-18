// database
import * as Assignment from './database/Assignment.js';
import * as AssignmentDatabase from './database/AssignmentDatabase.js';
import * as Database from './database/Database.js';
import * as Review from './database/Review.js';
import * as ReviewDatabase from './database/ReviewDatabase.js';
import * as Schedule from './database/Schedule.js';
import * as ScheduleDatabase from './database/ScheduleDatabase.js';
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
    ScheduleDatabase,
    Submission,
    SubmissionDatabase,
    User,
    UserDatabase,
    Vacation,
    VacationDatabase
};

// pipeline
import * as DatabaseSetup from './stages/setup/DatabaseSetup.js';
import * as AssignmentLoader from './stages/loader/AssignmentLoader.js';
import * as ConfigLoader from './stages/loader/ConfigLoader.js';
import * as DatabaseLoader from './stages/loader/DatabaseLoader.js';
import * as ReviewProcessor from './stages/processor/ReviewProcessor.js';
import * as DatabaseProcessor from './stages/processor/DatabaseProcessor.js';
import * as OutputProcessor from './stages/processor/OutputProcessor.js';
const PIPELINE_EXPORTS = {
    DatabaseSetup,
    AssignmentLoader,
    ConfigLoader,
    DatabaseLoader,
    ReviewProcessor,
    DatabaseProcessor,
    OutputProcessor
};

// util
import * as ConsoleHelper from './util/ConsoleHelper.js';
import * as DateUtil from './util/DateUtil.js';
import * as FieldParser from './util/FieldParser.js';
import * as FileUtil from './util/FileUtil.js';
import * as MathHelper from './util/MathHelper.js';
import * as ParseUtil from './util/ParseUtil.js';
import TableBuilder from './util/TableBuilder.js';
const UTIL_EXPORTS = {
    ConsoleHelper,
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
import { setupDatabase } from './stages/setup/DatabaseSetup.js';
import { loadParsers } from './stages/loader/ParserLoader.js';
import { loadDatabase } from './stages/loader/DatabaseLoader.js';
import { loadAssigners } from './stages/loader/AssignerLoader.js';
import { loadAssignments } from './stages/loader/AssignmentLoader.js';
import { processReviews } from './stages/processor/ReviewProcessor.js';
import { processDatabase } from './stages/processor/DatabaseProcessor.js';

import chalk from 'chalk';
import * as Menu from './menu/Menu.js';

export async function run()
{
    Menu.printTitle();
    Menu.println();

    /**
     * Setup - Where all resources that loaders require to import
     * should be initialized.
     */

    // Prepare global environment for external scripts...
    global.Library = Library;

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
    Menu.println("...Success!");
    Menu.println();

    /**
     * Loading - Where all data should be loaded from file. This
     * should be raw data as defined by the user. No modifications
     * should take place; they will be considered for alterations
     * in the processing stage.
     */

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
    Menu.println("...Success!");
    Menu.println();

    Menu.println("Date:", db.currentDate.toDateString());
    Menu.println();

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
    Menu.println("...Success!");

    Menu.println("Parsing databases...");
    try
    {
        await loadDatabase(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }
    Menu.println("...Success!");

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
    Menu.println("...Success!");

    Menu.println("Assigning assignments...");
    try
    {
        await loadAssignments(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }
    Menu.println("...Success!");

    Menu.println();

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
    console.log("...Processing...");
    await processReviews(db, config);
    await processDatabase(db, config);

    

    /**
     * Outputting - Where all data is outputted into relevant
     * files. If any errors had occured, it will exit-early and
     * output any gathered debug information.
     */
    console.log("...Outputting...");
    if (db.getErrors().length > 0)
    {
        console.log("......Oh no! We found some errors...");
        console.log("......Finding debug info for you...");
        await DebugInfoOutput.output(db, config.outputPath, config);

        console.log("...Failed!");
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

    /**
     * Cleanup - Where all resources are destroyed, just to make
     * sure nothing leaks.
     */
    ConsoleHelper.quit();
    console.log("......Stopped.");
    console.log();

    process.exit(0);
}

async function runProcess()
{
    // Declare Library as global variable.
    global.Library = Library;

    /**
     * Setup - Where all resources that loaders require to import
     * should be initialized.
     */
    console.log("Starting...");
    const config = await loadConfig(configPath);
    const db = await setupDatabase(config);

    // HACK: How do people access today's date?
    if ('currentDate' in config)
    {
        db.currentDate = ParseUtil.parseAmericanDate(config.currentDate);
    }
    else
    {
        db.currentDate = new Date(Date.now());
    }

    /**
     * Loading - Where all data should be loaded from file. This
     * should be raw data as defined by the user. No modifications
     * should take place; they will be considered for alterations
     * in the processing stage.
     */
    console.log("...Loading...");
    await loadDatabase(db, config);
    await loadAssignments(db, config);

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
    console.log("...Processing...");
    await processReviews(db, config);
    await processDatabase(db, config);

    /**
     * Outputting - Where all data is outputted into relevant
     * files. If any errors had occured, it will exit-early and
     * output any gathered debug information.
     */
    console.log("...Outputting...");
    if (db.getErrors().length > 0)
    {
        console.log("......Oh no! We found some errors...");
        console.log("......Finding debug info for you...");
        await DebugInfoOutput.output(db, config.outputPath, config);

        console.log("...Failed!");
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

    /**
     * Cleanup - Where all resources are destroyed, just to make
     * sure nothing leaks.
     */
    ConsoleHelper.quit();
    console.log("......Stopped.");
    console.log();
}

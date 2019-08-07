// database
import * as Assignment from './database/Assignment.js';
import * as AssignmentDatabase from './database/AssignmentDatabase.js';
import * as AssignmentGenerator from './database/AssignmentGenerator.js';
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
export {
    Assignment,
    AssignmentDatabase,
    AssignmentGenerator,
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
import * as DatabaseSetup from './pipeline/setup/DatabaseSetup.js';
import * as AssignmentLoader from './pipeline/loader/AssignmentLoader.js';
import * as ConfigLoader from './pipeline/loader/ConfigLoader.js';
import * as DatabaseLoader from './pipeline/loader/DatabaseLoader.js';
import * as ReviewProcessor from './pipeline/processor/ReviewProcessor.js';
import * as DatabaseProcessor from './pipeline/processor/DatabaseProcessor.js';
import * as DebugInfoOutput from './pipeline/output/DebugInfoOutput.js';
import * as ReportOutput from './pipeline/output/ReportOutput.js';
export {
    DatabaseSetup,
    AssignmentLoader,
    ConfigLoader,
    DatabaseLoader,
    ReviewProcessor,
    DatabaseProcessor,
    DebugInfoOutput,
    ReportOutput
};

// util
import * as ConsoleHelper from './util/ConsoleHelper.js';
import * as DateUtil from './util/DateUtil.js';
import * as FieldParser from './util/FieldParser.js';
import * as FileUtil from './util/FileUtil.js';
import * as MathHelper from './util/MathHelper.js';
import * as ParseUtil from './util/ParseUtil.js';
import TableBuilder from './util/TableBuilder.js';
export {
    ConsoleHelper,
    DateUtil,
    FieldParser,
    FileUtil,
    MathHelper,
    ParseUtil,
    TableBuilder
}

import { loadConfig } from './pipeline/loader/ConfigLoader.js';
import { setupDatabase } from './pipeline/setup/DatabaseSetup.js';
import { loadDatabase } from './pipeline/loader/DatabaseLoader.js';
import { loadAssignments } from './pipeline/loader/AssignmentLoader.js';
import { processReviews } from './pipeline/processor/ReviewProcessor.js';
import { processDatabase } from './pipeline/processor/DatabaseProcessor.js';

export async function run(configPath = './config.json')
{
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
        await DebugInfoOutput.output(db, config.outputPath);

        console.log("...Failed!");
    }
    else
    {
        console.log("......Hooray! Everything is as expected...");

        if (config.debug)
        {
            console.log("......Finding debug info for you...");
            await DebugInfoOutput.output(db, config.outputPath);
        }

        console.log("......Generating reports for you...");
        await ReportOutput.output(db, config.outputPath);

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

const path = require('path');
const ConsoleHelper = require('./util/ConsoleHelper.js');

main();

const CONFIG_PATH = './config.json';
const DEBUG_MODE = true;
const CURRENT_DATE =  new Date(Date.UTC(2018, 7 - 1, 19));

async function main()
{
    /**
     * Setup - Where all resources that loaders require to import
     * should be initialized.
     */
    console.log("Starting...");
    const db = await setupDatabase();

    /**
     * Loading - Where all data should be loaded from file. This
     * should be raw data as defined by the user. No modifications
     * should take place; they will be considered for alterations
     * in the processing stage.
     */
    console.log("...Loading...");
    const config = await loadConfig(CONFIG_PATH);

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
        await outputDebugInfo(db, config);
    }
    else
    {
        console.log("......Hooray! Everything is as expected...");

        if (DEBUG_MODE)
        {
            console.log("......Finding debug info for you...");
            await outputDebugInfo(db, config);
        }

        console.log("......Generating reports for you...");
        await outputReports(db, config);
    }

    /**
     * Cleanup - Where all resources are destroyed, just to make
     * sure nothing leaks.
     */
    ConsoleHelper.quit();
    console.log("...Complete!");
}

async function setupDatabase()
{
    const Database = require('./database/Database.js');
    const db = Database.createDatabase();

    // NOTE: User-defined databases...
    const UserDatabase = require('./database/UserDatabase.js');
    const ScheduleDatabase = require('./database/ScheduleDatabase.js');
    const SubmissionDatabase = require('./database/SubmissionDatabase.js');
    const AssignmentDatabase = require('./database/AssignmentDatabase.js');
    const ReviewDatabase = require('./database/ReviewDatabase.js');

    UserDatabase.setupDatabase(db);
    ScheduleDatabase.setupDatabase(db);
    SubmissionDatabase.setupDatabase(db);
    AssignmentDatabase.setupDatabase(db);
    ReviewDatabase.setupDatabase(db);

    return db;
}

async function loadConfig(configPath)
{
    // TODO: This should loaded externally, rather than be hard-coded...
    return {
        assignments: [
            /* ...??? */
        ],
        parsers: [
            { filePath: "./parser/cohort-parser.js", inputPath: "./__TEST__/in/cohort.csv", opts: {} },
            { filePath: "./parser/contributions-parser.js", inputPath: "./__TEST__/in/contributions.csv" },
            { filePath: "./parser/reviews-parser.js", inputPath: "./__TEST__/in/reviews.csv" },
        ],
        reviewers: [
            // { name: "change-owner", filePath: "./src/reviewer/SubmissionChangeOwnerHandler.js" }
        ]
    }
}

async function loadDatabase(db, config)
{
    const parserResults = [];
    for(const parserConfig of config.parsers)
    {
        const filePath = path.resolve(__dirname, parserConfig.filePath);
        const inputPath = path.resolve(__dirname, parserConfig.inputPath);
        const parser = require(filePath);

        console.log(`......Parsing '${path.basename(parserConfig.inputPath)}' with '${path.basename(parserConfig.filePath)}'...`);
        parserResults.push(parser.parse(db, inputPath, parserConfig.opts));
    }

    return Promise.all(parserResults);
}

async function loadAssignments(db, config)
{
    // Create assignments...
    
    // NOTE: Custom assignment handlers...
    const UserDatabase = require('./database/UserDatabase.js');
    const ScheduleDatabase = require('./database/ScheduleDatabase.js');
    const { offsetDate } = require('./util/DateUtil.js');
    const AssignmentGenerator = require('./database/AssignmentGenerator.js');

    for(const userID of UserDatabase.getUsers(db))
    {
        const schedule = ScheduleDatabase.getScheduleByUserID(db, userID);

        AssignmentGenerator.assign(db, userID, 'intro', offsetDate(schedule.startDate, 7));
        AssignmentGenerator.assignWeekly(db, userID, 'week', schedule.firstSunday, schedule.lastSunday);
        AssignmentGenerator.assign(db, userID, 'last', new Date(schedule.lastSunday.getTime()));
    }
}

async function processReviews(db, config)
{
    // Process reviews...

    // NOTE: Custom review handlers...
    const ReviewProcessor = require('./database/ReviewProcessor.js');

    ReviewProcessor.processReviews(db);
}

async function processDatabase(db, config)
{
    // Try to auto-resolve unassigned assignments by post id.

    // NOTE: Custom submission resolvers...
    const autoSubmissionResolver = require('./resolver/auto-submission-resolver.js');
    const introSubmissionResolver = require('./resolver/intro-submission-resolver.js');
    const assignSubmissionResolver = require('./resolver/assign-submission-resolver.js');
    const slipUserResolver = require('./resolver/slip-user-resolver.js');
    
    await introSubmissionResolver.resolve(db);
    await autoSubmissionResolver.resolve(db);
    // 2nd pass - Evaluate post type
    await assignSubmissionResolver.resolve(db);
    await slipUserResolver.resolve(db, CURRENT_DATE);
}

async function outputDebugInfo(db, config)
{
    const OUTPUT_DIR = path.resolve(__dirname, '__TEST__/out/');

    // TODO: Should output logs only if requested or has errors.
    const UserDatabase = require('./database/UserDatabase.js');
    const ScheduleDatabase = require('./database/ScheduleDatabase.js');
    const SubmissionDatabase = require('./database/SubmissionDatabase.js');
    const AssignmentDatabase = require('./database/AssignmentDatabase.js');
    const ReviewDatabase = require('./database/ReviewDatabase.js');
    const { writeToFile } = require('./util/FileUtil.js');

    UserDatabase.outputLog(db, OUTPUT_DIR);
    ScheduleDatabase.outputLog(db, OUTPUT_DIR);
    SubmissionDatabase.outputLog(db, OUTPUT_DIR);
    AssignmentDatabase.outputLog(db, OUTPUT_DIR);
    ReviewDatabase.outputLog(db, OUTPUT_DIR);

    let output;
    if (db.getErrors().length <= 0)
    {
        output = "HOORAY! No errors!";
    }
    else
    {
        output = "It's okay. We'll get through this.\n\n" + db.getErrors().join('\n');
    }
    writeToFile(path.resolve(OUTPUT_DIR, 'errors.txt'), output);
}

async function outputReports(db, config)
{
    const UserDatabase = require('./database/UserDatabase.js');
    const AssignmentDatabase = require('./database/AssignmentDatabase.js');
    const { writeTableToCSV } = require('./util/FileUtil.js');

    const OUTPUT_DIR = path.resolve(__dirname, '__TEST__/out/');

    // COMPLETE = 0x2713 (checkmark)
    const COMPLETE_TOKEN = '\u2713';
    // INCOMPLETE = 0x2717 (cross) (RED)
    const INCOMPLETE_TOKEN = '\u2717';
    // UNASSIGNED = _ (empty)
    const UNASSIGNED_TOKEN = '\u25A0';
    const INPROGRESS_TOKEN = '...';
    // INREVIEW = ?
    const INREVIEW_TOKEN = '?';
    // POSTPONED = ...
    const POSTPONED_TOKEN = '...';
    // OUTOFBOUNDS = 0x25A0 (filled square) (DARK)
    const OUTOFBOUNDS_TOKEN = '_';

    const assignments = ['intro', 'week[1]', 'week[2]', 'week[3]', 'week[4]', 'week[5]', 'week[6]'];
    const assignmentColumns = [];
    for(const assignmentID of assignments)
    {
        assignmentColumns.push({
            header: assignmentID + ' Status',
            data(db, userID)
            {
                const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
                if (!assignment) return 'ERROR';
                return assignment.attributes.status;
            }
        },
        {
            header: assignmentID + ' Slips',
            data(db, userID)
            {
                const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
                if (!assignment) return 'ERROR';
                return assignment.attributes.slips;
            }
        });
    }

    const outputTable = generateUserTable(db, [
        {
            header: 'Used Slips',
            data(db, userID)
            {
                return UserDatabase.getUserByID(db, userID).attributes.slips.used;
            }
        },
        {
            header: 'Remaining Slips',
            data(db, userID)
            {
                return UserDatabase.getUserByID(db, userID).attributes.slips.remaining;
            }
        },
        {
            header: 'Max Slips',
            data(db, userID)
            {
                return UserDatabase.getUserByID(db, userID).attributes.slips.max;
            }
        },
        {
            header: 'Auto-report',
            data(db, userID)
            {
                return 'N/A';
            }
        },
        ...assignmentColumns
    ]);
    
    writeTableToCSV(path.resolve(OUTPUT_DIR, 'slip-days.csv'), outputTable);
}

function generateUserTable(db, columns)
{
    const UserDatabase = require('./database/UserDatabase.js');
    
    const result = [];

    const header = columns.map(e => e.header);
    header.unshift('User ID');
    result.push(header);

    for(const userID of UserDatabase.getUsers(db))
    {
        const row = [];
        row.push(userID);
        
        for(const column of columns)
        {
            row.push(column.data(db, userID));
        }

        result.push(row);
    }

    return result;
}
const path = require('path');
const ConsoleHelper = require('./util/ConsoleHelper.js');
const TableBuilder = require('./util/TableBuilder.js');

main();

const CONFIG_PATH = './config.json';
// 2019
const CURRENT_DATE =  new Date(Date.UTC(2019, 7 - 1, 8));
// 2018
// const CURRENT_DATE =  new Date(Date.UTC(2018, 7 - 1, 19));

async function main()
{
    /**
     * Setup - Where all resources that loaders require to import
     * should be initialized.
     */
    console.log("Starting...");
    const db = await setupDatabase();

    // HACK: How do people access today's date?
    db.currentDate = CURRENT_DATE;

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

        console.log("...Failed!");
    }
    else
    {
        console.log("......Hooray! Everything is as expected...");

        if (config.debug)
        {
            console.log("......Finding debug info for you...");
            await outputDebugInfo(db, config);
        }

        console.log("......Generating reports for you...");
        await outputReports(db, config);

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
    const VacationDatabase = require('./database/VacationDatabase.js');

    UserDatabase.setupDatabase(db);
    ScheduleDatabase.setupDatabase(db);
    SubmissionDatabase.setupDatabase(db);
    AssignmentDatabase.setupDatabase(db);
    ReviewDatabase.setupDatabase(db);
    VacationDatabase.setupDatabase(db);

    return db;
}

async function loadConfig(configPath)
{
    // TODO: This should loaded externally, rather than be hard-coded...
    return {
        debug: true,
        assignments: [
            /* ...??? */
            // Order does not matter.
            { name: "intro", filePath: "./assigner/date-assigner.js", opts: {} },
            { name: "week", filePath: "./assigner/weekly-assigner.js", opts: {} },
            { name: "last", filePath: "./assigner/date-assigner.js", opts: {} }
        ],
        parsers: [
            // Order matters here! Lower entries will overwrite higher ones.
            // 2019
            { filePath: "./parser/cohort-parser.js", inputPath: "./__TEST__/in/2019/cohort.csv", opts: { threshold: 3 } },
            { filePath: "./parser/contributions-parser.js", inputPath: "./__TEST__/in/2019/contributions.csv" },
            { filePath: "./parser/reviews-parser.js", inputPath: "./__TEST__/in/2019/reviews.csv" },
            { filePath: "./parser/vacations-parser.js", inputPath: "./__TEST__/in/2019/vacations.csv" },
            /*
            // 2018
            { filePath: "./parser/cohort-parser.js", inputPath: "./__TEST__/in/cohort.csv", opts: {} },
            { filePath: "./parser/contributions-parser.js", inputPath: "./__TEST__/in/contributions.csv" },
            { filePath: "./parser/reviews-parser.js", inputPath: "./__TEST__/in/reviews.csv" },
            */
        ],
        reviewers: [
            // Order does not matter
            { name: "ignore_owner", filePath: "./reviewer/ignore-owner-submission-reviewer.js" },
            { name: "ignore_submission", filePath: "./reviewer/ignore-submission-reviewer.js" },
            { name: "change_assignment", filePath: "./reviewer/change-assignment-submission-reviewer.js" },
            { name: "add_owner_key", filePath: "./reviewer/add-owner-key-user-reviewer.js" },
            { name: "unknown", filePath: "./reviewer/unknown-reviewer.js" },
        ],
        resolvers: [
            // Order matters here! The higher ones execute before the lower ones.
            { filePath: "./resolver/auto-submission-resolver.js", opts: {} },
            { filePath: "./resolver/intro-submission-resolver.js" },
            // 2nd pass - Evaluate post type
            { filePath: "./resolver/assign-submission-resolver.js" },
            { filePath: "./resolver/slip-user-resolver.js" }
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
    const ReviewDatabase = require('./database/ReviewDatabase.js');
    console.log(`......Looking over our work...`);

    const reviewers = new Map();
    for(const reviewerConfig of config.reviewers)
    {
        const filePath = path.resolve(__dirname, reviewerConfig.filePath);
        const name = reviewerConfig.name;
        const reviewer = require(filePath);

        console.log(`.........Reviewing '${name}' with '${path.basename(reviewerConfig.filePath)}'...`);

        reviewers.set(name, reviewer);
    }

    const reviewResults = [];
    for(const reviewID of ReviewDatabase.getReviews(db))
    {
        const review = ReviewDatabase.getReviewByID(db, reviewID);
        const reviewType = review.type;
        const reviewParams = review.params;

        let reviewer;
        if (reviewers.has(reviewType))
        {
            reviewer = reviewers.get(reviewType);
        }
        else
        {
            reviewer = reviewers.get('unknown');
        }

        reviewResults.push(reviewer.review(db, reviewID, reviewType, reviewParams));
    }

    return Promise.all(reviewResults);
}

async function processDatabase(db, config)
{
    // Try to auto-resolve any issues in the database...
    console.log(`......Helping you fix a few things...`);

    const resolverResults = [];
    for(const resolverConfig of config.resolvers)
    {
        const filePath = path.resolve(__dirname, resolverConfig.filePath);
        const resolver = require(filePath);

        console.log(`.........Resolving with '${path.basename(resolverConfig.filePath)}'...`);
        resolverResults.push(resolver.resolve(db, resolverConfig.opts));
    }

    return Promise.all(resolverResults);
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
    const VacationDatabase = require('./database/VacationDatabase.js');
    const { writeToFile } = require('./util/FileUtil.js');

    UserDatabase.outputLog(db, OUTPUT_DIR);
    ScheduleDatabase.outputLog(db, OUTPUT_DIR);
    SubmissionDatabase.outputLog(db, OUTPUT_DIR);
    AssignmentDatabase.outputLog(db, OUTPUT_DIR);
    ReviewDatabase.outputLog(db, OUTPUT_DIR);
    VacationDatabase.outputLog(db, OUTPUT_DIR);

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

    const tableBuilder = new TableBuilder();
    tableBuilder.addColumn('User ID');
    tableBuilder.addColumn('Used Slips', (userID) => {
        return UserDatabase.getUserByID(db, userID).attributes.slips.used;
    });
    tableBuilder.addColumn('Remaining Slips', (userID) => {
        return UserDatabase.getUserByID(db, userID).attributes.slips.remaining;
    });
    tableBuilder.addColumn('Average Slips', (userID) => {
        return UserDatabase.getUserByID(db, userID).attributes.slips.average;
    });
    tableBuilder.addColumn('Max Slips', (userID) => {
        return UserDatabase.getUserByID(db, userID).attributes.slips.max;
    });
    tableBuilder.addColumn('Auto-report', (userID) => {
        // The auto-report threshold formula
        // Check the average if maintained from today, would it exceed by the end date.
        const averageSlips = UserDatabase.getUserByID(db, userID).attributes.slips.average;
        // Check if there are any holes in submissions.
        // Check if intro or week 1 is past due date.
        return 'N/A';
    });

    const assignments = ['intro', 'week[1]', 'week[2]', 'week[3]', 'week[4]', 'week[5]', 'week[6]'];
    for(const assignmentID of assignments)
    {
        tableBuilder.addColumn(assignmentID + ' Status', (userID) => {
            const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
            if (!assignment) return '!ERROR';
            return assignment.attributes.status;
        });
        tableBuilder.addColumn(assignmentID + ' Slips', (userID) => {
            const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
            if (!assignment) return '!ERROR';
            return assignment.attributes.slips;
        });
    }

    // Populate the table...
    for(const userID of UserDatabase.getUsers(db))
    {
        tableBuilder.addEntry(userID);
    }
    
    const outputTable = tableBuilder.build();
    writeTableToCSV(path.resolve(OUTPUT_DIR, 'slip-days.csv'), outputTable);
}

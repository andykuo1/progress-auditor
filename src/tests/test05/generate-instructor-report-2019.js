const path = require('path');

const Database = require('./database/Database.js');
const UserDatabase = require('./database/UserDatabase.js');
const ScheduleDatabase = require('./database/ScheduleDatabase.js');
const SubmissionDatabase = require('./database/SubmissionDatabase.js');
const AssignmentDatabase = require('./database/AssignmentDatabase.js');
const AssignmentGenerator = require('./database/AssignmentGenerator.js');
const ReviewDatabase = require('./database/ReviewDatabase.js');
const ReviewProcessor = require('./database/ReviewProcessor.js');
const { offsetDate, compareDates } = require('./util/DateUtil.js');
const { writeTableToCSV, writeToFile } = require('./util/FileUtil.js');

const cohortParser = require('./parser/cohort-parser.js');
const contributionsParser = require('./parser/contributions-parser.js');
const reviewsParser = require('./parser/reviews-parser.js');

const autoSubmissionResolver = require('./resolver/auto-submission-resolver.js');
const introSubmissionResolver = require('./resolver/intro-submission-resolver.js');
const assignSubmissionResolver = require('./resolver/assign-submission-resolver.js');
const slipUserResolver = require('./resolver/slip-user-resolver.js');

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const INPUT_DIR = path.resolve(__dirname, '__TEST__/in/2019/');
const OUTPUT_DIR = path.resolve(__dirname, '__TEST__/out/');

function outputError(db, outputDir)
{
    let output;
    if (db.getErrors().length <= 0)
    {
        output = "HOORAY! No errors!";
    }
    else
    {
        output = "It's okay. We'll get through this.\n\n" + db.getErrors().join('\n');
    }
    writeToFile(path.resolve(outputDir, 'errors.txt'), output);
    db.clearErrors();
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

async function main()
{
    const db = Database.createDatabase();
    UserDatabase.setupDatabase(db);
    ScheduleDatabase.setupDatabase(db);
    SubmissionDatabase.setupDatabase(db);
    AssignmentDatabase.setupDatabase(db);
    ReviewDatabase.setupDatabase(db);

    // Create users and schedules...
    await cohortParser.parse(path.resolve(INPUT_DIR, 'cohort.csv'), db);

    // Create submissions...
    await contributionsParser.parse(path.resolve(INPUT_DIR, 'contributions.csv'), db);

    // Create assignments...
    for(const userID of UserDatabase.getUsers(db))
    {
        const schedule = ScheduleDatabase.getScheduleByUserID(db, userID);

        AssignmentGenerator.assign(db, userID, 'intro', offsetDate(schedule.startDate, 7));
        AssignmentGenerator.assignWeekly(db, userID, 'week', schedule.firstSunday, schedule.lastSunday);
        AssignmentGenerator.assign(db, userID, 'last', new Date(schedule.lastSunday));
    }

    // Create reviews...
    await reviewsParser.parse(path.resolve(INPUT_DIR, 'reviews.csv'), db);

    // Process reviews...
    ReviewProcessor.processReviews(db);

    // Try to auto-resolve unassigned assignments by post id.
    await introSubmissionResolver.resolve(db);
    await autoSubmissionResolver.resolve(db);
    // 2nd pass - Evaluate post type
    await assignSubmissionResolver.resolve(db);
    await slipUserResolver.resolve(db, new Date(2019, 7 - 1, 9));

    UserDatabase.outputLog(db, OUTPUT_DIR);
    ScheduleDatabase.outputLog(db, OUTPUT_DIR);
    SubmissionDatabase.outputLog(db, OUTPUT_DIR);
    AssignmentDatabase.outputLog(db, OUTPUT_DIR);
    ReviewDatabase.outputLog(db, OUTPUT_DIR);
    outputError(db, OUTPUT_DIR);

    processContributions(db);
}

main();

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function processContributions(db)
{
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
            header: 'Average Slips Per Week',
            data(db, userID)
            {
                return UserDatabase.getUserByID(db, userID).attributes.slips.average;
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

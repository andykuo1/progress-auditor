const { writeTableToCSV } = require('../FileUtil.js');
const contributionsParser = require('./csv-contributions-parser.js');
const cohortsParser = require('./csv-cohorts-parser.js');
const Database = require('../Database.js');

const AssignmentDatabase = require('../AssignmentDatabase.js');

const IntroAssignment = require('./IntroAssignment.js');
const WeeklyAssignment = require('./WeeklyAssignment.js');
const LastAssignment = require('./LastAssignment.js');

const OUTPUT_PATH = './out/slip-days.csv';

const CURRENT_TIME = new Date(2018, 7 - 1, 9).getTime();
const ONE_DAYTIME = 86400000;







async function main()
{
    const db = Database.createDatabase();

    AssignmentDatabase.setupDatabase(db);
    const introAssignment = AssignmentDatabase.registerAssignmentClass(db, new IntroAssignment());
    const weeklyAssignment = AssignmentDatabase.registerAssignmentClass(db, new WeeklyAssignment());
    const lastAssignment = AssignmentDatabase.registerAssignmentClass(db, new LastAssignment());

    await cohortsParser.parse('./out/test01/cohorts.csv', db);
    for(const userID of db.user.keys())
    {
        const schedule = db.schedule.get(userID);
        AssignmentDatabase.assignAssignment(db, introAssignment, userID, schedule);
        AssignmentDatabase.assignAssignment(db, weeklyAssignment, userID, schedule);
        AssignmentDatabase.assignAssignment(db, lastAssignment, userID, schedule);
    }

    // Dependent on assignments...
    await contributionsParser.parse('./out/test01/contributions.csv', db);
    
    processContributions(db);
}










function calculateSlipDays(submitDate, dueDate)
{
    const duration = dueDate.getTime() - submitDate.getTime();
    if (duration < 0)
    {
        return -Math.ceil(duration / 86400000);
    }
    else
    {
        return 0;
    }
}

function processContributions(db)
{
    const assignments = [
        'intro',
        'week1',
        'week2',
        'week3',
        'week4',
        'week5',
        'week6',
        'week7',
        'last'
    ];
    const header = [];
    header.push('User');
    for(const assignmentID of assignments)
    {
        header.push(assignmentID + ' submitted');
        header.push(assignmentID + ' slips');
    }

    const table = [];

    // Header
    table.push(header);

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

    // Content
    for(const userID of db.user.keys())
    {
        const row = [];
        row.push(userID);
        for(const assignmentID of assignments)
        {
            const assignment = db.assignment.instance.get(userID)[assignmentID];
            const submissions = db.submission.get(db.user.get(userID).ownerKey);

            if (assignment.active)
            {
                // No submissions yet for an active assignment...
                if (!submissions || !submissions.has(assignmentID) || submissions.get(assignmentID).length <= 0)
                {
                    row.push(INCOMPLETE_TOKEN);
                    const slips = calculateSlipDays(new Date(CURRENT_TIME), assignment.dueDate);
                    row.push(slips);
                }
                // There is a submission!
                else
                {
                    // TODO: This should get the most recent one instead...
                    const submission = submissions.get(assignmentID)[0];
                    row.push(COMPLETE_TOKEN);
                    const slips = calculateSlipDays(submission.date, assignment.dueDate);
                    row.push(slips);
                }
            }
            else
            {
                row.push(UNASSIGNED_TOKEN);
                row.push('N/A');
            }
        }
        table.push(row);
    }
    writeTableToCSV(OUTPUT_PATH, table);
}

main();

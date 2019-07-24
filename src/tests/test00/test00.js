const { printTable, printDivider, printRow } = require('../ConsoleHelper.js');
const { createSchedule, calculateNumberOfSlipDays } = require('./schedule.js');
const { generateAssignments } = require('./assignment.js');

const WEEK_DAYS = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
function dateString(date)
{
    return (date.getMonth() + 1) + '/' + date.getDate() + ':' + WEEK_DAYS[date.getDay()];
}

function generateUserReport(db, userID)
{
    const userData = ['Andrew', new Date('Jul 01, 2019'), new Date('Aug 01, 2019')];
    const schedule = createSchedule(userData[1], userData[2], { threshold: 2 });
    const assignments = generateAssignments(schedule);

    {
        const LENGTH = 20;
        printDivider(LENGTH);
        printRow('    Name: ' + userData[0], LENGTH);
        printRow('   Start: ' + dateString(userData[1]), LENGTH);
        printRow('     End: ' + dateString(userData[2]), LENGTH);
        printRow('MaxSlips: ' + calculateNumberOfSlipDays(schedule), LENGTH)
        printDivider(LENGTH);
        console.log();
    }

    generateUserSchedule(db, schedule, assignments);
    console.log();
    generateSubmissionReport(db, userData, schedule, assignments);
    console.log();
}

function generateSubmissionReport(db, userData, schedule, assignments)
{
    const submissions = new Map();
    submissions.set('intro', {
        status: 'Y',
        postponed: 0,
        timestamp: new Date('July 06, 2019')
    });
    submissions.set('week1', {
        status: 'Y',
        postponed: 0,
        timestamp: new Date('July 14, 2019')
    });
    submissions.set('week2', {
        status: 'Y',
        postponed: 0,
        timestamp: new Date('July 21, 2019')
    });
    submissions.set('week3', {
        status: 'Y',
        postponed: 0,
        timestamp: new Date('July 28, 2019')
    });
    submissions.set('week4', {
        status: 'Y',
        postponed: 0,
        timestamp: new Date('Aug 04, 2019')
    });
    submissions.set('week5', {
        status: 'Y',
        postponed: 0,
        timestamp: new Date('Aug 11, 2019')
    });
    submissions.set('last', {
        status: 'N',
        postponed: 0,
        timestamp: new Date('Aug 18, 2019')
    });

    // Compute statuses for each submission...
    {
        const header = ['Assign', 'Due', 'Submit', 'Status', 'Postponed'];
        const entries = [];
        for(const assignment of assignments)
        {
            const assignmentSubs = submissions.get(assignment.name);
            const submission = Array.isArray(assignmentSubs) ? assignmentSubs[0] : assignmentSubs;
            entries.push([assignment.name, dateString(assignment.date), dateString(submission.timestamp), submission.status]);
        }
        printTable(entries, header);
    }
}

function generateUserSchedule(db, schedule, assignments)
{
    const dueDates = [];
    const header = [];
    for(const assignment of assignments)
    {
        header.push(assignment.name);
        dueDates.push(dateString(assignment.date));
    }
    printTable([dueDates], header);
}

generateUserReport();


// COMPLETE = 0x2713 (checkmark)
const COMPLETE_TOKEN = '\u2713';
// INCOMPLETE = 0x2717 (cross) (RED)
const INCOMPLETE_TOKEN = '\u2717';
// UNASSIGNED = _ (empty)
const UNASSIGNED_TOKEN = '\u25A0';
// INREVIEW = ?
const INREVIEW_TOKEN = '?';
// POSTPONED = ...
const POSTPONED_TOKEN = '...';
// OUTOFBOUNDS = 0x25A0 (filled square) (DARK)
const OUTOFBOUNDS_TOKEN = '_';

function generateWeekStatusReport(userID, maxWeeks)
{

}

function generateInstructorReport(db)
{
    // Show Key
    const OUTPUT_LENGTH = 24;
    printDivider(OUTPUT_LENGTH);
    printRow('Key', OUTPUT_LENGTH);
    printDivider(OUTPUT_LENGTH);
    printRow(`${COMPLETE_TOKEN}: Complete`, OUTPUT_LENGTH);
    printRow(`${INCOMPLETE_TOKEN}: Incomplete`, OUTPUT_LENGTH);
    printRow(`${UNASSIGNED_TOKEN}: Unassigned`, OUTPUT_LENGTH);
    printRow(`${INREVIEW_TOKEN}: In-review`, OUTPUT_LENGTH);
    printRow(`${OUTOFBOUNDS_TOKEN}: Out-of-bounds`, OUTPUT_LENGTH);
    printRow(`${POSTPONED_TOKEN}: Vacation`, OUTPUT_LENGTH);
    printDivider(OUTPUT_LENGTH);
    console.log();

    // Show table
    const table = [
        ['Andrew', '3/4', COMPLETE_TOKEN, INCOMPLETE_TOKEN + '(-1)', UNASSIGNED_TOKEN, UNASSIGNED_TOKEN, OUTOFBOUNDS_TOKEN, OUTOFBOUNDS_TOKEN],
        ['Cookies', '2/4', INCOMPLETE_TOKEN + '(-2)', UNASSIGNED_TOKEN, UNASSIGNED_TOKEN, OUTOFBOUNDS_TOKEN, OUTOFBOUNDS_TOKEN, OUTOFBOUNDS_TOKEN],
        ['Pancakes', '3/4', COMPLETE_TOKEN + '(-1)', COMPLETE_TOKEN, UNASSIGNED_TOKEN, OUTOFBOUNDS_TOKEN, OUTOFBOUNDS_TOKEN, OUTOFBOUNDS_TOKEN],
        ['Waffles', '-3/4', COMPLETE_TOKEN + '(-3)', COMPLETE_TOKEN + '(-4)' + INREVIEW_TOKEN, POSTPONED_TOKEN, UNASSIGNED_TOKEN, UNASSIGNED_TOKEN, OUTOFBOUNDS_TOKEN],
    ];

    const COL_HEADERS = ['Name', 'Slips', 'W0', 'W1', 'W2', 'W3', 'W4', 'W5'];

    printTable(table, COL_HEADERS);
    console.log();
}

// generateInstructorReport();

/*
console.log("Example schedule for...");
const startDate = new Date('2019-07-03 06:00:01 UTC');
const endDate = new Date('2019-09-23 00:00:01 UTC');
const dueDates = generateDueDates(startDate, endDate);
console.log("START:", startDate);
console.log("END:", endDate);
console.log(dueDates.join('\n'));
*/

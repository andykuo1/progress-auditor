const { writeTableToCSV } = require('../FileUtil.js');
const contributionsParser = require('./csv-contributions-parser.js');
const cohortsParser = require('./csv-cohorts-parser.js');
const Database = require('../Database.js');

const Assignment = require('../Assignment.js');
const AssignmentDatabase = require('../AssignmentDatabase.js');
const OUTPUT_PATH = './out/slip-days.csv';

const CURRENT_TIME = new Date(2018, 7 - 1, 9).getTime();
const ONE_DAYTIME = 86400000;

class IntroAssignment extends Assignment
{
    constructor()
    {
        super('intro');
    }

    /** @override */
    getDueAssignments(userID, userSchedule, otherAssignments)
    {
        // Add week 0 deadline - this does not follow the formats of
        // the other due dates. Instead, it is exactly 1 week after
        // the start date. This also means it can overlap with week 1.
        const dueDate = new Date(userSchedule.startDate);
        dueDate.setDate(dueDate.getDate() + 7);
        const active = userSchedule.startDate.getTime() < CURRENT_TIME;
        return {
            'intro': Assignment.createDueAssignment(this, dueDate, active)
        };
    }

    /** @override */
    getAssignmentID(headerContent, bodyContent='')
    {
        if (/intro/i.test(headerContent) || /week ?0+/i.test(headerContent))
        {
            return this.name;
        }
        else
        {
            return null;
        }
    }
}

class WeeklyAssignment extends Assignment
{
    constructor()
    {
        super('weekly');
    }

    /** @override */
    getDueAssignments(userID, userSchedule, otherAssignments)
    {
        const result = {};

        // Add the remaining weekly due dates. This includes the last
        // week (even if partial week, they may still need to turn it in,
        // depending on the threshold set)...
        let pastSunday = new Date(userSchedule.startSunday);
        let active = pastSunday.getTime() <= CURRENT_TIME;
        for(let i = 0; i < userSchedule.weeks - 1; ++i)
        {
            // Go to next Sunday...
            pastSunday.setDate(pastSunday.getDate() + 7);
            // Add the next week to result...
            result['week' + (i + 1)] = Assignment.createDueAssignment(this, new Date(pastSunday), active);

            if (pastSunday.getTime() > CURRENT_TIME) active = false;
        }

        return result;
    }

    /** @override */
    hasAssignmentID(assignmentID)
    {
        return /week[0-9]+/i.test(assignmentID);
    }

    /** @override */
    getAssignmentID(headerContent, bodyContent='')
    {
        const pattern = /week ?([0-9]+)/i;
        const result = pattern.exec(headerContent);
        if (!result || result.length <= 0) return null;
        return 'week' + result[1];
    }
}

class LastAssignment extends Assignment
{
    constructor()
    {
        super('last');
    }

    /** @override */
    getDueAssignments(userID, userSchedule, otherAssignments)
    {
        let active = userSchedule.lastSunday.getTime() <= CURRENT_TIME + 7 * ONE_DAYTIME;
        return {
            'last': Assignment.createDueAssignment(this, new Date(userSchedule.lastSunday), active)
        };
    }

    /** @override */
    getAssignmentID(headerContent, bodyContent='')
    {
        if (/last/i.test(headerContent))
        {
            return this.name;
        }
        else
        {
            return null;
        }
    }
}

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

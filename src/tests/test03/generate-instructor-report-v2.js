const { writeTableToCSV } = require('../FileUtil.js');
const Database = require('../Database.js');

const AssignmentDatabase = require('../AssignmentDatabase.js');

const contributionsParser = require('../test01/csv-contributions-parser.js');
const cohortsParser = require('../test01/csv-cohorts-parser.js');
const IntroAssignment = require('../test01/IntroAssignment.js');
const WeeklyAssignment = require('../test01/WeeklyAssignment.js');
const LastAssignment = require('../test01/LastAssignment.js');

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const OUTPUT_PATH = './out/slip-days-v2.csv';

const CURRENT_TIME = new Date(2018, 7 - 1, 9).getTime();
const ONE_DAYTIME = 86400000;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

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

    console.log(db);
    processContributions(db);
}

main();

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

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
    const outputTable = generateUserTable(db, [
        {
            header: 'Used Slips',
            data(userID)
            {
                return 0;
            }
        },
        {
            header: 'Remaining Slips',
            data(userID)
            {
                return 0;
            }
        },
        {
            header: 'Max Slips',
            data(userID)
            {
                return 0;
            }
        },
        {
            header: 'Auto-report',
            data(userID)
            {
                return '';
            }
        },
    ]);

    writeTableToCSV(OUTPUT_PATH, outputTable);
}

function generateUserTable(db, columns)
{
    const result = [];

    const header = columns.map(e => e.header);
    header.unshift('User ID');
    result.push(header);

    for(const userID of db.user.keys())
    {
        const row = [];
        row.push(userID);
        
        for(const column of columns)
        {
            row.push(column.data(userID));
        }

        result.push(row);
    }

    return result;
}
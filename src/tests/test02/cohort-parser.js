const { readCSVFileByRow } = require('../FileUtil.js');
const { parseAmericanDate } = require('../ParseUtil.js');
const UserDatabase = require('../UserDatabase.js');
const ScheduleDatabase = require('../ScheduleDatabase.js');

function parseName(value)
{
    return value;
}

function parseEmail(value, ...values)
{
    if (values.length > 0)
    {
        const result = [value];
        for(const value of values)
        {
            result.push(parseEmail(value));
        }
        return result;
    }
    else
    {
        return value;
    }
}

/**
 * Create UserDatabase and ScheduleDatabase based on input file.
 * @param {String} filepath The path to the file to parse.
 * @param {Database} db The database to write to.
 */
async function parse(filepath, db)
{
    UserDatabase.setupDatabase(db);
    ScheduleDatabase.setupDatabase(db);

    let first = true;
    await readCSVFileByRow(filepath, (row) => {
        // Skip header...
        if (first) { first = false; return; }

        // 0. Timestamp
        // 1. Email Address
        // 2. Last name
        // 3. First name
        // 4. Display name
        // 5. PID
        // 6. Email
        // ...
        // 11. Start date of internship
        // 12. Anticipated end date of internship
        // ...
        // 24. EASy approval date
        // 25. Admin notes
        // 28. Max slip days allowed (giving 4 instead of 3 per week to account for time zone)
        // ...
        try
        {
            const userID = parseEmail(row[6]);
            const ownerKey = parseEmail(row[6], row[1]);
            const userName = parseName(`${row[3]} ${row[2]}`);
            const user = UserDatabase.addUser(db, userID, ownerKey, userName);

            const startDate = parseAmericanDate(row[11]);
            const endDate = parseAmericanDate(row[12]);
            const schedule = ScheduleDatabase.addSchedule(db, userID, startDate, endDate, { threshold: 2 });
        }
        catch(e)
        {
            db.throwError(UserDatabase.USER_KEY, 'Unable to parse user.', e);
        }
    });

    return db;
}

module.exports = {
    parse
};
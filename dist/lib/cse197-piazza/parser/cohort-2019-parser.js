const { UserDatabase, ScheduleDatabase, FileUtil, ParseUtil, FieldParser } = Library;

/**
 * Create UserDatabase and ScheduleDatabase based on input file.
 * @param {Database} db The database to write to.
 * @param {String} filepath The path to the file to parse.
 * @param {Object} opts Any additional options.
 */
async function parse(db, filepath, opts={ threshold: 2 })
{
    UserDatabase.setupDatabase(db);
    ScheduleDatabase.setupDatabase(db);

    let first = true;
    await FileUtil.readCSVFileByRow(filepath, (row) => {
        // Skip header...
        if (first) { first = false; return; }

        // 0. Timestamp
        // 1. Email Address (not sure what this is for)
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
            const userID = FieldParser.parseEmail(row[6]);
            const ownerKey = FieldParser.parseEmail(row[6], row[1]);
            const userName = FieldParser.parseName(`${row[3]} ${row[2]}`);
            const user = UserDatabase.addUser(db, userID, ownerKey, userName);

            const startDate = ParseUtil.parseAmericanDate(row[11]);
            const endDate = ParseUtil.parseAmericanDate(row[12]);
            const schedule = ScheduleDatabase.addSchedule(db, userID, startDate, endDate, { threshold: opts.threshold });
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
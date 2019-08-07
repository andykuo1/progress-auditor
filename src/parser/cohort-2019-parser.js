import { readCSVFileByRow } from '../util/FileUtil.js';
import { parseAmericanDate } from '../util/ParseUtil.js';
import { parseEmail, parseName } from '../util/FieldParser.js';
import * as UserDatabase from '../database/UserDatabase.js';
import * as ScheduleDatabase from '../database/ScheduleDatabase.js';

/**
 * Create UserDatabase and ScheduleDatabase based on input file.
 * @param {Database} db The database to write to.
 * @param {String} filepath The path to the file to parse.
 * @param {Object} opts Any additional options.
 */
export async function parse(db, filepath, opts={ threshold: 2 })
{
    UserDatabase.setupDatabase(db);
    ScheduleDatabase.setupDatabase(db);

    let first = true;
    await readCSVFileByRow(filepath, (row) => {
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
            const userID = parseEmail(row[6]);
            const ownerKey = parseEmail(row[6], row[1]);
            const userName = parseName(`${row[3]} ${row[2]}`);
            const user = UserDatabase.addUser(db, userID, ownerKey, userName);

            const startDate = parseAmericanDate(row[11]);
            const endDate = parseAmericanDate(row[12]);
            const schedule = ScheduleDatabase.addSchedule(db, userID, startDate, endDate, { threshold: opts.threshold });
        }
        catch(e)
        {
            db.throwError(UserDatabase.USER_KEY, 'Unable to parse user.', e);
        }
    });

    return db;
}

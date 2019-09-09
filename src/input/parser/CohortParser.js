import * as UserDatabase from '../../database/UserDatabase.js';
import * as FileUtil from '../../util/FileUtil.js';
import * as FieldParser from '../../util/FieldParser.js';
import * as DateUtil from '../../util/DateUtil.js';

/**
 * Create UserDatabase based on input file.
 * @param {Database} db The database to write to.
 * @param {Config} config The program config.
 * @param {String} filepath The path to the file to parse.
 * @param {Object} opts Any additional options.
 */
export async function parse(db, config, filepath, opts={ threshold: 2 })
{
    UserDatabase.setupDatabase(db);

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
            const pid = row[5].trim().toUpperCase();
            const startDate = DateUtil.parseAmericanDate(row[11]);
            const endDate = DateUtil.parseAmericanDate(row[12]);
            const user = UserDatabase.addUser(db, userID, ownerKey, userName, startDate, endDate, opts, { pid });
        }
        catch(e)
        {
            db.throwError('PARSE', 'Unable to parse users - ' + e);
        }
    });

    return db;
}

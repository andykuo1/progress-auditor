const { readCSVFileByRow } = require('../util/FileUtil.js');
const { parseDate } = require('../util/ParseUtil.js');
const { parseEmail } = require('../util/FieldParser.js');
const VacationDatabase = require('../database/VacationDatabase.js');

/**
 * Create VacationDatabase based on input file.
 * @param {Database} db The database to write to.
 * @param {String} filepath The path to the file to parse.
 * @param {Object} opts Any additional options.
 */
async function parse(db, filepath, opts={})
{
    VacationDatabase.setupDatabase(db);

    let first = true;
    await readCSVFileByRow(filepath, (row) => {
        // Skip header...
        if (first) { first = false; return; }

        // 0. Vacation ID
        // 1. User ID
        // 2. Start Date
        // 3. End Date
        // 4. Padding
        // ...
        try
        {
            const vacationID = row[0];
            const userID = parseEmail(row[1]);
            const startDate = parseDate(row[2]);
            const endDate = parseDate(row[3]);
            const padding = row[4];

            const vacation = VacationDatabase.addVacation(db, vacationID, userID, startDate, endDate, padding);
        }
        catch(e)
        {
            db.throwError(VacationDatabase.VACATION_KEY, 'Unable to parse vacation.', e);
        }
    });

    return db;
}

module.exports = {
    parse
};
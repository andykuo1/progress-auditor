import * as UserDatabase from '../../database/UserDatabase.js';
import * as FileUtil from '../../util/FileUtil.js';
import * as FieldParser from '../../util/FieldParser.js';
import * as DateUtil from '../../util/DateUtil.js';

// TODO: not used yet.
export const PARSER_OPTIONS = {
    maxEndDates: {
        type: "Array<{ pattern, endDate }>",
        description: "An array of max end date entries that, if the specified pattern matched, will limit the user's end date to the specified date."
    }
};

/**
 * Create UserDatabase based on input file.
 * @param {Database} db The database to write to.
 * @param {Config} config The program config.
 * @param {String} filepath The path to the file to parse.
 * @param {Object} opts Any additional options.
 */
export async function parse(db, config, filepath, opts={ maxEndDates: [] })
{
    UserDatabase.setupDatabase(db);

    const maxEndDateEntries = processMaxEndDateEntries(opts.maxEndDates);

    let first = true;
    await FileUtil.readCSVFileByRow(filepath, (row) => {
        // Skip header...
        if (first) { first = false; return; }
        //Company ,Company location,Which quarter will you enroll in CSE 197?,"Does your internship start *before* June 17, 2019",Start date of internship,Anticipated end date of internship,Expected UCSD Graduation,How many CSE internships have you already completed?,How did you hear about your internship?,Do you have an offer of employment at a CSE internship,Is your major in CSE?,"Does your internship satisfy all of the following criteria: (1) projects are related to your CSE major, (2) full-time (at least 30 hours of work each week and at least 8 weeks long), (3) paid, (4) on-site (at the company's place of business; tele-commuting internships do not qualify), (5) with a designated company mentor / supervisor.",Have you enrolled in CSE 197 before?,Will you be part of a cohort of interns at your company participating in an established internship program?,Will this be your first time employed by this company?,Are you planning to be in San Diego in the Fall (following your internship)?,Additional explanation or extenuating circumstances?,Are you required to complete and sign a CPT form?,EASy Dept approval,6 month coop,Max slip days allowed,Slip days used as of 7.8,Latest reflection as of 7.8.19,7.12.19 Notes,Slip days used as of 7.15,Latest reflection as of 7.15.19,7.15.19 Notes
        // 0. Timestamp
        // 1. Email Address (not sure what this is for)
        // 2. Last name
        // 3. First name
        // 4. Display name
        // 5. PID
        // 6. Email
        // ...
        // 9. Which quarter will you enroll in CSE 197?
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

            // Max end date option...
            const enrollmentQuarter = row[9];
            for(const maxEndDateEntry of maxEndDateEntries)
            {
                if (maxEndDateEntry.pattern.test(enrollmentQuarter))
                {
                    if (DateUtil.compareDates(endDate, maxEndDateEntry.endDate) > 0)
                    {
                        endDate.setTime(maxEndDateEntry.endDate.getTime());
                    }
                }
            }
            const user = UserDatabase.addUser(db, userID, ownerKey, userName, startDate, endDate, opts, { pid });
        }
        catch(e)
        {
            db.throwError('PARSE', 'Unable to parse users - ' + e);
        }
    });

    return db;
}

function processMaxEndDateEntries(maxEndDates)
{
    if (!Array.isArray(maxEndDates)) return [];
    if (maxEndDates.length <= 0) return [];

    const result = [];
    for(const maxEndDate of maxEndDates)
    {
        result.push({
            pattern: new RegExp(maxEndDate.pattern),
            endDate: DateUtil.parse(maxEndDate.endDate),
        });
    }
    return result;
}
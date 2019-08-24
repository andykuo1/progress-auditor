import * as Database from '../../database/Database.js';
import * as UserDatabase from '../../database/UserDatabase.js';
import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';
import * as AssignmentDatabase from '../../database/AssignmentDatabase.js';
import * as ReviewDatabase from '../../database/ReviewDatabase.js';
import * as VacationDatabase from '../../database/VacationDatabase.js';

import * as ParseUtil from '../../util/ParseUtil.js';

// TODO: this is still hard-coded...
export async function setupDatabase(config)
{
    const db = Database.createDatabase();

    // HACK: How do people access today's date?
    let currentDate;
    if ('currentDate' in config)
    {
        currentDate = ParseUtil.parseAmericanDate(config.currentDate);
    }
    else
    {
        currentDate = new Date(Date.now());
    }
    db.currentDate = currentDate;
    
    // Actually setup the databases...
    UserDatabase.setupDatabase(db);
    SubmissionDatabase.setupDatabase(db);
    AssignmentDatabase.setupDatabase(db);
    ReviewDatabase.setupDatabase(db);
    VacationDatabase.setupDatabase(db);

    return db;
}

/**
 * Clears the database of all data stored from parsers. This does not remove
 * any loaded resources, such as scripts. This is used to restart the
 * database for new reviews or other resolvers. If you want a completely NEW
 * database, just delete it and setup a new one.
 * @param {Database} db The database to clear data from.
 * @param {Object} config The config.
 */
export async function clearDatabase(db, config)
{
    UserDatabase.clearDatabase(db);
    SubmissionDatabase.clearDatabase(db);
    AssignmentDatabase.clearDatabase(db);
    ReviewDatabase.clearDatabase(db);
    VacationDatabase.clearDatabase(db);

    return db;
}

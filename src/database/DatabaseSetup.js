/**
 * This file handles setting up and clearing the database.
 * 
 * @module DatabaseSetup
 */

import * as Database from './Database.js';
import * as UserDatabase from './UserDatabase.js';
import * as SubmissionDatabase from './SubmissionDatabase.js';
import * as AssignmentDatabase from './AssignmentDatabase.js';
import * as ReviewDatabase from './ReviewDatabase.js';
import * as VacationDatabase from './VacationDatabase.js';

import * as DateUtil from '../util/DateUtil.js';

export async function setupDatabase(config)
{
    const db = Database.createDatabase();

    // HACK: How do people access today's date?
    let currentDate;
    if ('currentDate' in config)
    {
        currentDate = DateUtil.parse(config.currentDate);
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
    db.clearErrors();

    return db;
}

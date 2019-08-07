const Database = require('../../database/Database.js');
const UserDatabase = require('../../database/UserDatabase.js');
const ScheduleDatabase = require('../../database/ScheduleDatabase.js');
const SubmissionDatabase = require('../../database/SubmissionDatabase.js');
const AssignmentDatabase = require('../../database/AssignmentDatabase.js');
const ReviewDatabase = require('../../database/ReviewDatabase.js');
const VacationDatabase = require('../../database/VacationDatabase.js');


// TODO: this is still hard-coded...
async function setupDatabase(config)
{
    const db = Database.createDatabase();

    // NOTE: User-defined databases...
    UserDatabase.setupDatabase(db);
    ScheduleDatabase.setupDatabase(db);
    SubmissionDatabase.setupDatabase(db);
    AssignmentDatabase.setupDatabase(db);
    ReviewDatabase.setupDatabase(db);
    VacationDatabase.setupDatabase(db);

    return db;
}

module.exports = {
    setupDatabase
};
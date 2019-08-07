import * as Database from '../../database/Database.js';
import * as UserDatabase from '../../database/UserDatabase.js';
import * as ScheduleDatabase from '../../database/ScheduleDatabase.js';
import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';
import * as AssignmentDatabase from '../../database/AssignmentDatabase.js';
import * as ReviewDatabase from '../../database/ReviewDatabase.js';
import * as VacationDatabase from '../../database/VacationDatabase.js';

// TODO: this is still hard-coded...
export async function setupDatabase(config)
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

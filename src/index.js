// database
import * as Assignment from './database/Assignment.js';
import * as AssignmentDatabase from './database/AssignmentDatabase.js';
import * as Database from './database/Database.js';
import * as DatabaseSetup from './database/DatabaseSetup.js';
import * as Review from './database/Review.js';
import * as ReviewDatabase from './database/ReviewDatabase.js';
import * as Schedule from './database/Schedule.js';
import * as Submission from './database/Submission.js';
import * as SubmissionDatabase from './database/SubmissionDatabase.js';
import * as User from './database/User.js';
import * as UserDatabase from './database/UserDatabase.js';
import * as Vacation from './database/Vacation.js';
import * as VacationDatabase from './database/VacationDatabase.js';
const DATABASE_EXPORTS = {
    Assignment,
    AssignmentDatabase,
    Database,
    DatabaseSetup,
    Review,
    ReviewDatabase,
    Schedule,
    Submission,
    SubmissionDatabase,
    User,
    UserDatabase,
    Vacation,
    VacationDatabase
};

// util
import * as DateGenerator from './util/DateGenerator.js';
import * as DateUtil from './util/DateUtil.js';
import * as FieldParser from './util/FieldParser.js';
import * as FileUtil from './util/FileUtil.js';
import * as MathHelper from './util/MathHelper.js';
import TableBuilder from './util/TableBuilder.js';
const UTIL_EXPORTS = {
    DateGenerator,
    DateUtil,
    FieldParser,
    FileUtil,
    MathHelper,
    TableBuilder
};

// Named export
export const ProgressAuditor = {
    ...DATABASE_EXPORTS,
    ...UTIL_EXPORTS,
};

// Default export
export default ProgressAuditor;

// Global export
global.ProgressAuditor = ProgressAuditor;

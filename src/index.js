// database
import * as Assignment from './database/Assignment.js';
import * as AssignmentDatabase from './database/AssignmentDatabase.js';
import * as Database from './database/Database.js';
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
import * as DateUtil from './util/DateUtil.js';
import * as FieldParser from './util/FieldParser.js';
import * as FileUtil from './util/FileUtil.js';
import * as MathHelper from './util/MathHelper.js';
import * as ParseUtil from './util/ParseUtil.js';
import TableBuilder from './util/TableBuilder.js';
const UTIL_EXPORTS = {
    DateUtil,
    FieldParser,
    FileUtil,
    MathHelper,
    ParseUtil,
    TableBuilder
};

// lib
import * as AssignmentGenerator from './app/AssignmentGenerator.js';
const LIB_EXPORTS = {
    AssignmentGenerator
};

export const Library = {
    ...DATABASE_EXPORTS,
    // ...PIPELINE_EXPORTS,
    ...UTIL_EXPORTS,
    ...LIB_EXPORTS
};

global.Library = Library;
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

/*
// pipeline
import * as ConfigLoader from './stages/loader/ConfigLoader.js';
import * as DatabaseSetup from './stages/setup/DatabaseSetup.js';

import * as ParserLoader from './stages/loader/ParserLoader.js';
import * as AssignerLoader from './stages/loader/AssignerLoader.js';

import * as InputProcessor from './stages/processor/InputProcessor.js';
import * as AssignmentProcessor from './stages/processor/AssignmentProcessor.js';
import * as ReviewProcessor from './stages/processor/ReviewProcessor.js';
import * as PostProcessor from './stages/processor/PostProcessor.js';
import * as OutputProcessor from './stages/processor/OutputProcessor.js';

const PIPELINE_EXPORTS = {
    ConfigLoader,
    DatabaseSetup,

    ParserLoader,
    AssignerLoader,

    InputProcessor,
    AssignmentProcessor,
    ReviewProcessor,
    PostProcessor,
    OutputProcessor,
};
*/

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
import * as AssignmentGenerator from './lib/AssignmentGenerator.js';
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
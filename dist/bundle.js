'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const readline = require('readline');

const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function quit()
{
    readlineInterface.close();
}

const fs = require('fs');
const readline$1 = require('readline');
const Papa = require('papaparse');

function readJSONFile(filepath)
{
    const data = fs.readFileSync(filepath);
    return JSON.parse(data);
}

// TODO: Temporary hack for writing files, NOT ASYNC!
function writeToFile(filepath, content)
{
    fs.writeFile(filepath, content, function(err) {
        if (err)
        {
            return console.log(err);
        }

        console.log("File saved:", filepath);
    }); 
}

function writeTableToCSV(filepath, table)
{
    writeToFile(filepath, table.map(e => e.join(',')).join('\n'));
}

const path = require('path');
const fs$1 = require('fs');

const DEFAULT_CONFIG_FILE_NAME = 'config.js';

/**
 * Loads the config from the filepath. If there exists the 'include' property, it will
 * resolve those dependencies such that they are given priority and loaded first, in the
 * order defined, before this config. Any conflicting properties between configs are
 * either overridden or merged in the order visited. In other words, the last config in
 * the include list will override the first config. If the first config also has an
 * include list, those will load first, and therefore also be overriden by the last config.
 * And this "root" config will override all of them. If the property overriden is an array,
 * it will attempt to merge them instead.
 * @param {String} configPath The path to the config file.
 * @returns {Object} The config loaded from this file.
 */
async function loadConfig(configPath)
{
    console.log(`......Finding config file '${configPath}'...`);

    let parentConfig;
    let parentDir;
    if (fs$1.lstatSync(configPath).isDirectory())
    {
        parentConfig = readJSONFile(path.resolve(configPath, DEFAULT_CONFIG_FILE_NAME));
        parentDir = configPath;
    }
    else
    {
        parentConfig = readJSONFile(configPath);
        parentDir = path.dirname(configPath);
    }
    parentConfig = resolveConfigPaths(parentDir, parentConfig);

    if ('include' in parentConfig)
    {
        const configs = [];
        for(const includePath of parentConfig.include)
        {
            const childConfig = await loadConfig(includePath);
            configs.push(childConfig);
        }

        const mergedConfig = configs.reduce((prev, current) => mergeConfigs(current, prev), {});
        parentConfig = mergeConfigs(parentConfig, mergedConfig);
    }

    return parentConfig;
}

function resolveConfigEntry(parentPath, key, value)
{
    if (key.toLowerCase().endsWith('path'))
    {
        return resolveConfigPathEntry(parentPath, value);
    }
    else if (Array.isArray(value))
    {
        let result = [];
        for(const index in value)
        {
            result.push(resolveConfigEntry(parentPath, index, value[index]));
        }
        return result;
    }
    else if (typeof value === 'object')
    {
        let result = {};
        for(const [objectKey, objectValue] of Object.entries(value))
        {
            result[objectKey] = resolveConfigEntry(parentPath, objectKey, objectValue);
        }
        return result;
    }
    else
    {
        return value;
    }
}

function resolveConfigPathEntry(parentPath, value)
{
    if (Array.isArray(value))
    {
        let result = [];
        for(const entry of value)
        {
            result.push(resolveConfigPathEntry(parentPath, entry));
        }
        return result;
    }
    else if (typeof value === 'object')
    {
        return resolveConfigPaths(parentPath, value);
    }
    else if (typeof value === 'string')
    {
        return path.resolve(parentPath, value);
    }
    else
    {
        return value;
    }
}

function resolveConfigPaths(parentPath, config)
{
    const result = resolveConfigEntry(parentPath, '', config);

    // Overwrite 'include' and treat it as a path entry.
    if ('include' in config && Array.isArray(config.include))
    {
        result.include = config.include.map((value) => resolveConfigPathEntry(parentPath, value));
    }

    return result;
}

function mergeConfigs(src, dst)
{
    for(const [key, value] of Object.entries(src))
    {
        if (key in dst)
        {
            if (Array.isArray(dst[key]))
            {
                if (Array.isArray(value))
                {
                    dst[key] = dst[key].concat(value);
                }
                else
                {
                    dst[key].push(value);
                }
            }
        }
        else
        {
            dst[key] = src[key];
        }
    }
    return dst;
}

/**
 * Creates a database to hold all your data :)
 */
function createDatabase()
{
    return {
        _errors: [],
        throwError(...messages)
        {
            this._errors.push(messages.map(e => {
                switch(typeof e)
                {
                    case 'string':
                        return e;
                    case 'object':
                        return JSON.stringify(e, null, 4);
                    default:
                        return String(e);
                }
            }).join(' '));
        },
        clearErrors()
        {
            this._errors.length = 0;
        },
        getErrors()
        {
            return this._errors;
        }
    };
}

const USER_KEY = 'user';
const OUTPUT_LOG = 'db.user.log';

function setupDatabase(db)
{
    if (!(USER_KEY in db))
    {
        db[USER_KEY] = new Map();
    }
    return db;
}

function getUsers(db)
{
    return db[USER_KEY].keys();
}

function getUserByID(db, id)
{
    return db[USER_KEY].get(id);
}

function outputLog(db, outputDir = '.')
{
    const userMapping = db[USER_KEY];
    const result = {};
    for(const [key, value] of userMapping.entries())
    {
        result[key] = value;
    }

    const header = `${'# '.repeat(20)}\n# Users\n# Size: ${userMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG), log);
}

const ONE_DAYTIME = 86400000;

function compareDates(a, b)
{
    return a.getTime() - b.getTime();
}

function isWithinDates(date, fromDate, toDate)
{
    return compareDates(date, fromDate) >= 0 && compareDates(date, toDate) <= 0;
}

function getDaysBetween(fromDate, toDate)
{
    return Math.floor(Math.abs(compareDates(toDate, fromDate)) / ONE_DAYTIME);
}

/**
 * Gets the date of the Sunday that has most recently passed.
 * @param {Date} date The date to calculate past Sunday from.
 * @param {Number} offset The number of days to offset from the date before calculations.
 * @returns {Date} The calculated Sunday date.
 */
function getPastSunday(date, offset=0)
{
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() - result.getUTCDay() + offset);
    return result;
}

/**
 * Gets the date of the Sunday that is coming.
 * @param {Date} date The date to calculate next Sunday from.
 * @param {Number} offset The number of days to offset from the date before calculations.
 * @returns {Date} The calculated Sunday date.
 */
function getNextSunday(date, offset=0)
{
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() - result.getUTCDay() + 7 + offset);
    return result;
}

function offsetDate(date, offset=0)
{
    const result = new Date(date.getTime());
    if (offset) result.setUTCDate(result.getUTCDate() + offset);
    return result;
}

const SCHEDULE_KEY = 'schedule';
const OUTPUT_LOG$1 = 'db.schedule.log';

function setupDatabase$1(db)
{
    if (!(SCHEDULE_KEY in db))
    {
        db[SCHEDULE_KEY] = new Map();
    }
    return db;
}

function getScheduleByUserID(db, userID)
{
    return db[SCHEDULE_KEY].get(userID);
}

function outputLog$1(db, outputDir = '.')
{
    const scheduleMapping = db[SCHEDULE_KEY];
    const result = {};
    for(const [key, value] of scheduleMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Schedules\n# Size: ${scheduleMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG$1), log);
}

const SUBMISSION_KEY = 'submission';
const SUBMISSION_OWNER_KEY = 'owner';
const SUBMISSION_LIST_KEY = 'list';
const OUTPUT_LOG$2 = 'db.submission.log';

function setupDatabase$2(db)
{
    if (!(SUBMISSION_KEY in db)) db[SUBMISSION_KEY] = {};
    
    const submissionMapping = db[SUBMISSION_KEY];
    if (!(SUBMISSION_OWNER_KEY in submissionMapping))
    {
        submissionMapping[SUBMISSION_OWNER_KEY] = new Map();
    }
    if (!(SUBMISSION_LIST_KEY in submissionMapping))
    {
        submissionMapping[SUBMISSION_LIST_KEY] = new Map();
    }

    return db;
}

function outputLog$2(db, outputDir = '.')
{
    const submissionOwnerMapping = db[SUBMISSION_KEY][SUBMISSION_OWNER_KEY];
    const submissionListMapping = db[SUBMISSION_KEY][SUBMISSION_LIST_KEY];
    const result = {
        owner: {},
        list: {},
    };
    for(const [key, value] of submissionOwnerMapping.entries())
    {
        result.owner[key] = value;
    }
    for(const [key, value] of submissionListMapping.entries())
    {
        result.list[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Submissions\n# Size: ${submissionListMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG$2), log);
}

/**
 * @param {Date} dueDate The date the assignment is due.
 * @param {Object} attributes Any additional attributes for the assignment.
 */
function createAssignment(dueDate, attributes={})
{
    return {
        dueDate,
        attributes
    };
}

const ASSIGNMENT_KEY = 'assignment';
const OUTPUT_LOG$3 = 'db.assignment.log';

function setupDatabase$3(db)
{
    if (!(ASSIGNMENT_KEY in db))
    {
        db[ASSIGNMENT_KEY] = new Map();
    }
    return db;
}

function addAssignment(db, userID, assignmentID, dueDate, attributes={})
{
    const assignmentMapping = db[ASSIGNMENT_KEY];

    let ownedAssignments;
    if (assignmentMapping.has(userID))
    {
        ownedAssignments = assignmentMapping.get(userID);
    }
    else
    {
        assignmentMapping.set(userID, ownedAssignments = {});
    }

    if (assignmentID in ownedAssignments)
    {
        db.throwError(ASSIGNMENT_KEY, 'Found duplicate assignment for user', userID);
        return null;
    }
    else
    {
        const assignment = createAssignment(new Date(dueDate.getTime()), attributes);
        ownedAssignments[assignmentID] = assignment;
        return assignment;
    }
}

function getAssignmentByID(db, userID, assignmentID)
{
    return db[ASSIGNMENT_KEY].get(userID)[assignmentID];
}

function outputLog$3(db, outputDir = '.')
{
    const assignmentMapping = db[ASSIGNMENT_KEY];
    const result = {};
    for(const [key, value] of assignmentMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Assignments\n# Size: ${assignmentMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG$3), log);
}

const REVIEW_KEY = 'review';
const OUTPUT_LOG$4 = 'db.review.log';

function setupDatabase$4(db)
{
    if (!(REVIEW_KEY in db))
    {
        db[REVIEW_KEY] = new Map();
    }
    return db;
}

function getReviews(db)
{
    return db[REVIEW_KEY].keys();
}

function getReviewByID(db, reviewID)
{
    return db[REVIEW_KEY].get(reviewID);
}

function outputLog$4(db, outputDir = '.')
{
    const reviewMapping = db[REVIEW_KEY];
    const result = {};
    for(const [key, value] of reviewMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Reviews\n# Size: ${reviewMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG$4), log);
}

const VACATION_KEY = 'vacation';
const OUTPUT_LOG$5 = 'db.vacation.log';

function setupDatabase$5(db)
{
    if (!(VACATION_KEY in db))
    {
        db[VACATION_KEY] = new Map();
    }
    return db;
}

/**
 * Assumes all vacations are disjoint. In other words, they do not overlap.
 * @param {Database} db The database to work off with.
 * @param {*} userID The user that we want to find vacations from.
 * @param {Date} date The date to offset.
 */
function offsetDateByVacations(db, userID, date)
{
    const vacationMapping = db[VACATION_KEY];
    const vacations = getVacationsByUserID(db, userID);
    vacations.sort((a, b) => vacationMapping.get(a).effectiveStartDate.getTime() - vacationMapping.get(b).effectiveStartDate.getTime());

    let result = new Date(date.getTime());
    for(const vacationID of vacations)
    {
        const vacation = vacationMapping.get(vacationID);
        if (isWithinDates(result, vacation.effectiveStartDate, vacation.effectiveEndDate))
        {
            const days = getDaysBetween(result, vacation.effectiveStartDate);
            result.setTime(result.getTime() + days * ONE_DAYTIME);
        }
    }
    return result;
}

function getVacationsByUserID(db, userID)
{
    const vacationMapping = db[VACATION_KEY];
    const result = [];
    for(const vacationData of vacationMapping.values())
    {
        if (vacationData.userID == userID)
        {
            result.push(vacationData.id);
        }
    }
    return result;
}

function outputLog$5(db, outputDir = '.')
{
    const vacationMapping = db[VACATION_KEY];
    const result = {};
    for(const [key, value] of vacationMapping.entries())
    {
        result[key] = value;
    }

    const header = `${'# '.repeat(20)}\n# Vacations\n# Size: ${vacationMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG$5), log);
}

// TODO: this is still hard-coded...
async function setupDatabase$6(config)
{
    const db = createDatabase();

    // NOTE: User-defined databases...
    setupDatabase(db);
    setupDatabase$1(db);
    setupDatabase$2(db);
    setupDatabase$3(db);
    setupDatabase$4(db);
    setupDatabase$5(db);

    return db;
}

const path$1 = require('path');

async function loadDatabase(db, config)
{
    if (!('parsers' in config))
    {
        console.log('......No parsers found...');
        return Promise.resolve([]);
    }
    
    const parserResults = [];
    for(const parserConfig of config.parsers)
    {
        const filePath = parserConfig.filePath;
        const inputPath = parserConfig.inputPath;
        const parser = require(filePath);

        console.log(`......Parsing '${path$1.basename(parserConfig.inputPath)}' with '${path$1.basename(parserConfig.filePath)}'...`);
        parserResults.push(parser.parse(db, inputPath, parserConfig.opts));
    }

    return Promise.all(parserResults);
}

const DAYS_PER_WEEK = 7;
const MAX_GENERATED_ASSIGNMENTS = 100;

function assign(db, userID, assignmentID, dueDate, attributes = {})
{
    const newDueDate = offsetDateByVacations(db, userID, dueDate);
    return addAssignment(db, userID, assignmentID, newDueDate, attributes);
}

function assignWeekly(db, userID, assignmentBaseName, startDate, endDate, weekDay = 0, attributes = {})
{
    const result = [];

    let weekDate;
    if (startDate.getUTCDay() < weekDay)
    {
        // Week day for this week already passed. Use the next one.
        weekDate = getNextSunday(startDate);
    }
    else
    {
        // Week day for this week has yet to pass. Use this one.
        weekDate = getPastSunday(startDate);
    }
    weekDate.setUTCDate(weekDate.getUTCDate() + weekDay);

    weekDate = offsetDateByVacations(db, userID, weekDate);

    // Generate assignments...
    let count = 1;
    while(compareDates(weekDate, endDate) <= 0)
    {
        // Add the current week date to result...
        const assignment = addAssignment(db, userID, `${assignmentBaseName}[${count}]`, weekDate, Object.assign({}, attributes));
        result.push(assignment);

        // Go to next week day...
        weekDate.setUTCDate(weekDate.getUTCDate() + DAYS_PER_WEEK);
        weekDate = offsetDateByVacations(db, userID, weekDate);

        if (++count >= MAX_GENERATED_ASSIGNMENTS) break;
    }

    return result;
}

// TODO: this is still hard-coded...
async function loadAssignments(db, config)
{
    // Create assignments...
    
    // NOTE: Custom assignment handlers...
    for(const userID of getUsers(db))
    {
        const schedule = getScheduleByUserID(db, userID);
        assign(db, userID, 'intro', offsetDate(schedule.startDate, 7));
        assignWeekly(db, userID, 'week', schedule.firstSunday, schedule.lastSunday);
        assign(db, userID, 'last', new Date(schedule.lastSunday.getTime()));
    }
}

const path$2 = require('path');

async function processReviews(db, config)
{
    // Process reviews...
    console.log(`......Looking over our work...`);

    const reviewers = new Map();
    for(const reviewerConfig of config.reviewers)
    {
        const filePath = reviewerConfig.filePath;
        const name = reviewerConfig.name;
        const reviewer = require(filePath);

        console.log(`.........Reviewing '${name}' with '${path$2.basename(reviewerConfig.filePath)}'...`);

        reviewers.set(name, reviewer);
    }

    const reviewResults = [];
    for(const reviewID of getReviews(db))
    {
        const review = getReviewByID(db, reviewID);
        const reviewType = review.type;
        const reviewParams = review.params;

        let reviewer;
        if (reviewers.has(reviewType))
        {
            reviewer = reviewers.get(reviewType);
        }
        else
        {
            reviewer = reviewers.get('unknown');
        }

        reviewResults.push(reviewer.review(db, reviewID, reviewType, reviewParams));
    }

    return Promise.all(reviewResults);
}

const path$3 = require('path');

async function processDatabase(db, config)
{
    // Try to auto-resolve any issues in the database...
    console.log(`......Helping you fix a few things...`);

    const resolverResults = [];
    for(const resolverConfig of config.resolvers)
    {
        const filePath = resolverConfig.filePath;
        const resolver = require(filePath);

        console.log(`.........Resolving with '${path$3.basename(resolverConfig.filePath)}'...`);
        resolverResults.push(resolver.resolve(db, resolverConfig.opts));
    }

    return Promise.all(resolverResults);
}

const IDENTITY = function(a) { return a; };

class TableBuilder
{
    constructor()
    {
        this.entries = [];
        this.columns = [];
    }
    
    addEntry(...dataArgs)
    {
        this.entries.push(dataArgs);
    }

    addColumn(header, dataCallback = IDENTITY)
    {
        this.columns.push({
            header,
            data: dataCallback
        });
    }

    build()
    {
        const headerRow = [];
        for(const column of this.columns)
        {
            headerRow.push(column.header);
        }

        const table = [];
        table.push(headerRow);
        for(const entry of this.entries)
        {
            const row = [];
            for(const column of this.columns)
            {
                const value = column.data.apply(null, entry);
                row.push(value);
            }
            table.push(row);
        }
        return table;
    }
}

const path$4 = require('path');

async function output(db, outputPath, opts={})
{

    const tableBuilder = new TableBuilder();
    tableBuilder.addColumn('User ID');
    tableBuilder.addColumn('Used Slips', (userID) => {
        return getUserByID(db, userID).attributes.slips.used;
    });
    tableBuilder.addColumn('Remaining Slips', (userID) => {
        return getUserByID(db, userID).attributes.slips.remaining;
    });
    tableBuilder.addColumn('Average Slips', (userID) => {
        return getUserByID(db, userID).attributes.slips.average;
    });
    tableBuilder.addColumn('Max Slips', (userID) => {
        return getUserByID(db, userID).attributes.slips.max;
    });
    tableBuilder.addColumn('Auto-report', (userID) => {
        // The auto-report threshold formula
        // Check the average if maintained from today, would it exceed by the end date.
        const averageSlips = getUserByID(db, userID).attributes.slips.average;
        // Check if there are any holes in submissions.
        // Check if intro or week 1 is past due date.
        return 'N/A';
    });

    const assignments = ['intro', 'week[1]', 'week[2]', 'week[3]', 'week[4]', 'week[5]', 'week[6]'];
    for(const assignmentID of assignments)
    {
        tableBuilder.addColumn(assignmentID + ' Status', (userID) => {
            const assignment = getAssignmentByID(db, userID, assignmentID);
            if (!assignment) return '!ERROR';
            return assignment.attributes.status;
        });
        tableBuilder.addColumn(assignmentID + ' Slips', (userID) => {
            const assignment = getAssignmentByID(db, userID, assignmentID);
            if (!assignment) return '!ERROR';
            return assignment.attributes.slips;
        });
    }

    // Populate the table...
    for(const userID of getUsers(db))
    {
        tableBuilder.addEntry(userID);
    }
    
    const outputTable = tableBuilder.build();
    writeTableToCSV(path$4.resolve(outputPath, 'slip-days.csv'), outputTable);
}

const path$5 = require('path');

async function output$1(db, outputPath, opts={})
{
    // Output all database logs...
    outputLog(db, outputPath);
    outputLog$1(db, outputPath);
    outputLog$2(db, outputPath);
    outputLog$3(db, outputPath);
    outputLog$4(db, outputPath);
    outputLog$5(db, outputPath);

    // Output computed config file...
    writeToFile(path$5.resolve(outputPath, 'config.log'), JSON.stringify(config, null, 4));

    // Output error list...
    let output;
    if (db.getErrors().length <= 0)
    {
        output = "HOORAY! No errors!";
    }
    else
    {
        output = "It's okay. We'll get through this.\n\n" + db.getErrors().join('\n');
    }
    writeToFile(path$5.resolve(outputPath, 'errors.txt'), output);
}

function parseAmericanDate(value)
{
    // ex. 6/18/2019
    const result = new Date(1000);

    const dateArray = value.split('/');
    const year = Number(dateArray[2]);
    const month = Number(dateArray[0]);
    const day = Number(dateArray[1]);

    if (year === NaN || month === NaN || day === NaN) throw new Error('Invalid date format - should be MM/DD/YYYY.');

    result.setUTCFullYear(year);
    result.setUTCMonth(month - 1);
    result.setUTCDate(day);

    return result;
}

async function main(configPath = './config.json')
{
    /**
     * Setup - Where all resources that loaders require to import
     * should be initialized.
     */
    console.log("Starting...");
    const config = await loadConfig(configPath);
    const db = await setupDatabase$6();

    // HACK: How do people access today's date?
    if ('currentDate' in config)
    {
        db.currentDate = parseAmericanDate(config.currentDate);
    }
    else
    {
        db.currentDate = new Date(Date.now());
    }

    /**
     * Loading - Where all data should be loaded from file. This
     * should be raw data as defined by the user. No modifications
     * should take place; they will be considered for alterations
     * in the processing stage.
     */
    console.log("...Loading...");
    await loadDatabase(db, config);
    await loadAssignments(db);

    /**
     * Processing - Where all data is evaluated and processed into
     * valid and useful information. This is also where most of the
     * errors not related to IO will be thrown. This stage consists
     * of two steps: the review and the resolution. The resolution
     * step will attempt to automatically format and validate the
     * data. If it is unable to then the data is invalid and is
     * flagged for review by the user. Therefore, the review step,
     * which processes all user-created reviews, is computed before
     * the resolution. This is a frequent debug loop.
     */
    console.log("...Processing...");
    await processReviews(db, config);
    await processDatabase(db, config);

    /**
     * Outputting - Where all data is outputted into relevant
     * files. If any errors had occured, it will exit-early and
     * output any gathered debug information.
     */
    console.log("...Outputting...");
    if (db.getErrors().length > 0)
    {
        console.log("......Oh no! We found some errors...");
        console.log("......Finding debug info for you...");
        await output$1(db, config.outputPath);

        console.log("...Failed!");
    }
    else
    {
        console.log("......Hooray! Everything is as expected...");

        if (config.debug)
        {
            console.log("......Finding debug info for you...");
            await output$1(db, config.outputPath);
        }

        console.log("......Generating reports for you...");
        await output(db, config.outputPath);

        console.log("...Success!");
    }

    /**
     * Cleanup - Where all resources are destroyed, just to make
     * sure nothing leaks.
     */
    quit();
    console.log("......Stopped.");
    console.log();
}

exports.main = main;

'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var assert = _interopDefault(require('assert'));
var events = _interopDefault(require('events'));
var readline$1 = _interopDefault(require('readline'));
var os = _interopDefault(require('os'));
var fs$2 = _interopDefault(require('fs'));
var path$6 = _interopDefault(require('path'));

/**
 * @param {Date} dueDate The date the assignment is due.
 * @param {Object} attributes Any additional attributes for the assignment.
 */
function createAssignment(id, dueDate, attributes={})
{
    return {
        id,
        dueDate,
        attributes
    };
}

var Assignment = /*#__PURE__*/Object.freeze({
    createAssignment: createAssignment
});

/**
 * The key for the database to access Assignment data.
 */
const ASSIGNMENT_KEY = 'assignment';

/**
 * The name of the output log for this data.
 */
const OUTPUT_LOG = 'db.assignment.log';

/**
 * Prepares the database to be used for assignments.
 * @param {Database} db The database to prepare the sub-database for.
 */
function setupDatabase(db)
{
    if (!(ASSIGNMENT_KEY in db))
    {
        db[ASSIGNMENT_KEY] = new Map();
    }
    return db;
}

function clearDatabase(db)
{
    if (ASSIGNMENT_KEY in db)
    {
        db[ASSIGNMENT_KEY].clear();
    }
    return db;
}

/**
 * Adds an assignment, by id, to a given user with the specified due date.
 * @param {Database} db The current database to add to.
 * @param {String} userID The unique id of the user to add the assignment for.
 * @param {String} assignmentID The associated unique id for the assignment.
 * @param {Date} dueDate The due date for the assignment.
 * @param {Object} attributes Any additional options to be saved with the assignment.
 */
function addAssignment(db, userID, assignmentID, dueDate, attributes={})
{
    // Cache extra info for reviews...(used to know what assignmentIDs are possible)
    const cache = db.getCache();
    if (!cache.assignmentKeys) cache.assignmentKeys = new Set();
    cache.assignmentKeys.add(assignmentID);

    // Here the function really begins...
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
        db.throwError(ASSIGNMENT_KEY, `Found duplicate assignment '${assignmentID}' for user '${userID}'.`);
        return null;
    }
    else
    {
        const assignment = createAssignment(assignmentID, new Date(dueDate.getTime()), attributes);
        ownedAssignments[assignmentID] = assignment;
        return assignment;
    }
}

// TODO: assignmentID is a bit misleading. It should really by assignment type.
function getAssignmentByID(db, userID, assignmentID)
{
    return db[ASSIGNMENT_KEY].get(userID)[assignmentID];
}

/**
 * 
 * @param {Database} db The current database.
 * @param {*} userID The target user to search for.
 */
function getAssignmentsByUser(db, userID)
{
    return Object.keys(db[ASSIGNMENT_KEY].get(userID));
}

/**
 * Outputs all information related to assignments in this database.
 * @param {Database} db The current database.
 * @param {String} outputDir The output directory that will contain the output log.
 */
function outputLog(db, outputFunction, outputDir = '.')
{
    const assignmentMapping = db[ASSIGNMENT_KEY];
    const result = {};
    for(const [key, value] of assignmentMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Assignments\n# Size: ${assignmentMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    return outputFunction(require('path').resolve(outputDir, OUTPUT_LOG), log);
}

var AssignmentDatabase$1 = /*#__PURE__*/Object.freeze({
    ASSIGNMENT_KEY: ASSIGNMENT_KEY,
    setupDatabase: setupDatabase,
    clearDatabase: clearDatabase,
    addAssignment: addAssignment,
    getAssignmentByID: getAssignmentByID,
    getAssignmentsByUser: getAssignmentsByUser,
    outputLog: outputLog
});

/**
 * Generates a number hash for the string. For an empty string, it will return 0.
 * 
 * @param {String} [value=''] the string to hash
 * @returns {Number} a hash that uniquely identifies the string
 */
function stringHash(value='')
{
    let hash = 0;
    for(let i = 0, len = value.length; i < len; i++)
    {
        hash = Math.imul(31, hash) + value.charCodeAt(i) | 0;
    }
    return hash;
}

/**
 * Generates a uuid v4.
 * 
 * @param {Number} a The placeholder (serves for recursion within function).
 * @returns {String} the universally unique id
 */
function uuid(a = undefined)
{
    // https://gist.github.com/jed/982883
    return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuid);
}

var MathHelper = /*#__PURE__*/Object.freeze({
    stringHash: stringHash,
    uuid: uuid
});

/**
 * Creates a database to hold all your data :)
 * 
 * It also has some extra error-handling to help you log errors.
 */
function createDatabase()
{
    return {
        _registry: {},
        _cache: {},
        _errors: new Map(),
        throwError(tag, message, opts = {})
        {
            // Try to deterministically generate an id for the error.
            let id;
            if (typeof opts === 'object' && 'id' in opts)
            {
                if (Array.isArray(opts.id))
                {
                    id = stringHash(opts.id.join('.'));
                }
                else if (typeof opts.id !== 'number')
                {
                    id = stringHash(JSON.stringify(opts.id));
                }
                else
                {
                    id = opts.id;
                }
            }
            else
            {
                // If all else fails, I hope the program is mostly deterministic...
                id = this._errors.size;
            }
            
            // Find a valid error id.
            let MAX_ITERATIONS = 1000;
            while (MAX_ITERATIONS-- >= 0 && this._errors.has(id)) ++id;

            // There's just too much.
            if (MAX_ITERATIONS <= 0) throw new Error('Invalid error id - too many errors.');

            const dst = {
                id,
                tag,
                message,
                info: '',
                type: String(id),
                options: [],
                more: [],
                context: {},
                toString() { return `${id} [${tag}] ${message}`; }
            };

            if (typeof opts === 'string')
            {
                dst.options.push(opts);
            }
            else if (typeof opts === 'object')
            {
                if ('options' in opts)
                {
                    if (Array.isArray(opts.options))
                    {
                        for(const option of opts.options)
                        {
                            dst.options.push(option);
                        }
                    }
                    else
                    {
                        dst.options.push(option);
                    }
                }

                if ('more' in opts)
                {
                    dst.more = opts.more;
                }

                if ('context' in opts)
                {
                    dst.context = { ...opts.context };
                }

                if ('info' in opts)
                {
                    dst.info = String(opts.info);
                }

                if ('type' in opts)
                {
                    dst.type = String(opts.type);
                }
            }

            this._errors.set(id, dst);
        },
        removeErrorByID(id)
        {
            if (typeof id !== 'number') throw new Error('Error id must be a number.');

            if (this._errors.has(id))
            {
                this._errors.delete(id);
                return true;
            }
            return false;
        },
        getErrorByID(id)
        {
            if (typeof id !== 'number') throw new Error('Error id must be a number.');

            return this._errors.get(id);
        },
        clearErrors()
        {
            this._errors.clear();
        },
        getErrors()
        {
            return Array.from(this._errors.values());
        },
        getCache()
        {
            return this._cache;
        }
    };
}

var Database = /*#__PURE__*/Object.freeze({
    createDatabase: createDatabase
});

const ONE_DAYTIME = 86400000;
const DAYS_IN_WEEK = 7;

/**
 * Returns a negative number if a is less than b, a positive
 * number if a is greature than b, and 0 if they are equal.
 * This only compares the date; time is not considered.
 * @param {Date} a The left hand side date.
 * @param {Date} b The right hand side date.
 * @returns {Number} A number representing how a compares to b.
 */
function compareDates(a, b)
{
    const dayA = new Date(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()).getTime();
    const dayB = new Date(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()).getTime();
    return Math.ceil((dayA - dayB) / ONE_DAYTIME);
}

/**
 * Returns a negative number if a is less than b, a positive
 * number if a is greature than b, and 0 if they are equal.
 * This compares BOTH date and time.
 * @param {Date} a The left hand side date.
 * @param {Date} b The right hand side date.
 * @returns {Number} A number representing how a compares to b.
 */
function compareDatesWithTime(a, b)
{
    return a.getTime() - b.getTime();
}

function isWithinDates(date, fromDate, toDate)
{
    const dayDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const dayFrom = new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate());
    const dayTo = new Date(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate());
    return compareDatesWithTime(dayDate, dayFrom) >= 0 && compareDatesWithTime(dayDate, dayTo) <= 0;
}

function getDaysUntil(fromDate, toDate)
{
    const dayFrom = new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate());
    const dayTo = new Date(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate());
    return Math.floor(Math.abs(dayTo.getTime() - dayFrom.getTime()) / ONE_DAYTIME);
}

function copyDate(date)
{
    return new Date(date.getTime());
}

/**
 * If the date is between Sunday and Tuesday, get past Sunday.
 * If the date is between Thursday and Saturday, get next Sunday.
 * If the date is Wednesday, it depends on floorWednesday.
 * If floorWednesday is true, then it would choose past,
 * otherwise, it would choose next.
 * @param {Date} date The date to get nearest Sunday for.
 */
function getNearestSunday(date, floorWednesday = true)
{
    const day = date.getUTCDay();
    if (day < 3 || (floorWednesday && day === 3))
    {
        return getPastSunday(date);
    }
    else
    {
        return getNextSunday(date);
    }
}

/**
 * Gets the date of the Sunday of this week. Usually, this is the one most
 * recently passed, or today, if today is Sunday.
 * @param {Date} date The date to calculate past Sunday from.
 * @param {Number} offset The number of days to offset from the date before calculations.
 * @returns {Date} The calculated Sunday date.
 */
function getPastSunday(date, offset = 0)
{
    const result = copyDate(date);
    result.setUTCDate(result.getUTCDate() - result.getUTCDay() + offset);
    return result;
}

/**
 * Gets the date of the Sunday that has most recently passed. If today is Sunday, it will get the one before.
 * @param {Date} date The date to calculate past Sunday from.
 * @param {Number} offset The number of days to offset from the date before calculations.
 * @returns {Date} The calculated Sunday date.
 */
function getPrevSunday(date, offset = 0)
{
    const result = copyDate(date);
    const day = result.getUTCDay();
    if (day === 0)
    {
        result.setUTCDate(result.getUTCDate() - DAYS_IN_WEEK + offset);
    }
    else
    {
        result.setUTCDate(result.getUTCDate() - result.getUTCDay() + offset);
    }
    return result;
}

/**
 * Gets the date of the Sunday that is coming.
 * @param {Date} date The date to calculate next Sunday from.
 * @param {Number} offset The number of days to offset from the date before calculations.
 * @returns {Date} The calculated Sunday date.
 */
function getNextSunday(date, offset = 0)
{
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() - result.getUTCDay() + DAYS_IN_WEEK + offset);
    return result;
}

/**
 * Gets the effective week's date of the Sunday that is coming.
 * @param {Date} date The date to calculate the next Sunday from.
 * @param {Number} effectiveThreshold The min number of days in an effective week.
 * @returns {Date} The calculated effective week's Sunday date. At most, this is 2 weeks away.
 */
function getNextEffectiveSunday(date, effectiveThreshold = 0)
{
    // Whether to count the current week as the effective week, or use the next week instead.
    if (date.getUTCDay() > effectiveThreshold)
    {
        return getNextSunday(new Date(date.getTime() + DAYS_IN_WEEK * ONE_DAYTIME));
    }
    else
    {
        return getNextSunday(date);
    }
}

function offsetDate(date, offset = 0)
{
    const result = new Date(date.getTime());
    if (offset) result.setUTCDate(result.getUTCDate() + offset);
    return result;
}

/** This should is the NON-OFFICIAL way to parse dates. */
function parseAmericanDate(dateString, offset = 0)
{
    // Allow for both:
    // MM/DD/YYYY
    // MM-DD-YYYY
    const monthIndex = 0;
    let dayIndex, yearIndex;
    dayIndex = dateString.indexOf('/', monthIndex);
    if (dayIndex < 0)
    {
        dayIndex = dateString.indexOf('-', monthIndex);
        yearIndex = dateString.indexOf('-', dayIndex + 1);
    }
    else
    {
        yearIndex = dateString.indexOf('/', dayIndex + 1);
    }

    let year, month, day, hour, minute, second;

    if (dayIndex < 0 || monthIndex < 0 || yearIndex < 0)
    {
        throw new Error('Invalid date format - Expected MM/DD/YYYY');
    }
    
    year = Number(dateString.substring(yearIndex + 1));
    month = Number(dateString.substring(monthIndex, dayIndex));
    day = Number(dateString.substring(dayIndex + 1, yearIndex));
    hour = 0;
    minute = 0;
    second = 0;

    if (year === NaN || month === NaN || day === NaN || hour === NaN || minute === NaN || second === NaN)
    {
        throw new Error('Invalid date format - Expected MM/DD/YYYY');
    }

    const result = new Date(offset);
    result.setUTCFullYear(year);
    result.setUTCMonth(month - 1);
    result.setUTCDate(day);

    return result;
}

/** This should be the OFFICIAL way to parse dates. */
function parse(dateString)
{
    const yearIndex = 0;
    const monthIndex = dateString.indexOf('-', yearIndex);
    const dayIndex = dateString.indexOf('-', monthIndex + 1);

    // Allow for both:
    // YYYY-MM-DD HH:MM:SS
    // YYYY-MM-DD-HH:MM:SS
    
    let hourIndex, minuteIndex, secondIndex, endIndex;
    hourIndex = dateString.indexOf('-', dayIndex + 1);
    if (hourIndex < 0)
    {
        hourIndex = dateString.indexOf(' ', dayIndex + 1);
    }
    minuteIndex = dateString.indexOf(':', hourIndex + 1);
    secondIndex = dateString.indexOf(':', minuteIndex + 1);

    // The end could have a timezone appended to it, not just the end of the string...
    endIndex = dateString.indexOf(' ', secondIndex + 1);
    if (endIndex < 0) endIndex = dateString.length;

    let year, month, day, hour, minute, second;

    if (dayIndex < 0 || monthIndex < 0 || yearIndex < 0)
    {
        throw new Error('Invalid date format - Expected YYYY-MM-DD-hh:mm:ss');
    }

    if (hourIndex < 0 || minuteIndex < 0 || secondIndex < 0)
    {
        hourIndex = dateString.length;
        hour = 0;
        minute = 0;
        second = 0;
    }
    else
    {
        hour = Number(dateString.substring(hourIndex + 1, minuteIndex));
        minute = Number(dateString.substring(minuteIndex + 1, secondIndex));
        second = Number(dateString.substring(secondIndex + 1, endIndex));
    }

    year = Number(dateString.substring(yearIndex, monthIndex));
    month = Number(dateString.substring(monthIndex + 1, dayIndex));
    day = Number(dateString.substring(dayIndex + 1, hourIndex));

    if (year === NaN || month === NaN || day === NaN || hour === NaN || minute === NaN || second === NaN)
    {
        throw new Error('Invalid date format - Expected YYYY-MM-DD-hh:mm:ss');
    }
    
    const result = new Date(0);
    result.setUTCFullYear(year);
    result.setUTCMonth(month - 1);
    result.setUTCDate(day);
    result.setUTCHours(hour);
    result.setUTCMinutes(minute);
    result.setUTCSeconds(second);
    return result;
}

/** This should be the OFFICIAL way to stringify dates. */
function stringify(date, withTime = true)
{
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();
    const result = String(year).padStart(4, '0') + '-'
        + String(month).padStart(2, '0') + '-'
        + String(day).padStart(2, '0')
        + (withTime
            ? '-'
            + String(hour).padStart(2, '0') + ':'
            + String(minute).padStart(2, '0') + ':'
            + String(second).padStart(2, '0')
            : '');
    return result;
}

var DateUtil = /*#__PURE__*/Object.freeze({
    ONE_DAYTIME: ONE_DAYTIME,
    DAYS_IN_WEEK: DAYS_IN_WEEK,
    compareDates: compareDates,
    compareDatesWithTime: compareDatesWithTime,
    isWithinDates: isWithinDates,
    getDaysUntil: getDaysUntil,
    copyDate: copyDate,
    getNearestSunday: getNearestSunday,
    getPastSunday: getPastSunday,
    getPrevSunday: getPrevSunday,
    getNextSunday: getNextSunday,
    getNextEffectiveSunday: getNextEffectiveSunday,
    offsetDate: offsetDate,
    parseAmericanDate: parseAmericanDate,
    parse: parse,
    stringify: stringify
});

/**
 * The schedule does not have its own database.
 * Instead it is merged with the user data.
 * 
 * @module Schedule
 */

const ONE_DAYTIME$1 = 86400000;

/**
 * Calculates the number of available slip days for the
 * user based on the duration of their schedule.
 * @param {Object} schedule The schedule for the user.
 * @returns {Number} The number of slip days available.
 */
function calculateNumberOfSlipDays(schedule)
{
    return 3 * schedule.weeks;
}

function createSchedule(startDate, endDate, opts={})
{
    const threshold = opts.threshold || 0;
    const thresholdTime = ONE_DAYTIME$1 * threshold;

    // Whether to count the current week as the start week, or use the next week instead.
    const firstSunday = getNextEffectiveSunday(startDate, threshold);

    // Add the remaining week due dates. This includes the last
    // week (even if incomplete, they still need to turn it in)...
    const endTime = endDate.getTime() - thresholdTime;
    const pastSunday = getPastSunday(startDate);
    const lastSunday = new Date(pastSunday.getTime());
    // As long as we have started this week (even if it ends in-progress)
    // calculate last Sunday...
    let sundayCount = 0;
    while(lastSunday.getTime() < endTime)
    {
        // Go to next Sunday...
        lastSunday.setUTCDate(lastSunday.getUTCDate() + 7);
        ++sundayCount;
    }

    return {
        startDate,
        endDate,
        // Number of weeks within the schedule (by counting number of Sundays).
        weeks: sundayCount,
        // The Sunday belonging to the week of the start date.
        // This will likely not be within the schedule unless
        // the start date is a Sunday.
        startSunday: pastSunday,
        // The Sunday after the start date. May be of the same week as 
        // the start date if the schedule started on a Sunday.
        firstSunday,
        // The last Sunday of the week of the end date. Usually
        // This will be the last Sunday within the schedule.
        lastSunday,
    };
}

var Schedule = /*#__PURE__*/Object.freeze({
    ONE_DAYTIME: ONE_DAYTIME$1,
    calculateNumberOfSlipDays: calculateNumberOfSlipDays,
    createSchedule: createSchedule
});

/**
 * Creates a user object.
 * @param {*} userID The globally unique user id.
 * @param {String} ownerKey The unique key, or keys, that associates submissions to users. Can be an array if associated with multiple.
 * @param {String} userName The user's name.
 * @param {Date} startDate The start date for the user.
 * @param {Date} endDate The end date for the user.
 * @param {Object} opts Additional options to initialize the user.
 * @param {Number} opts.threshold The day threshold for week boundaries.
 * @param {Object} attributes Any additional information about the user.
 * @returns {Object} The user data object.
 */
function createUser(userID, ownerKey, userName, startDate, endDate, opts, attributes)
{
    const schedule = createSchedule(startDate, endDate, opts);
    return {
        id: userID,
        ownerKey,
        name: userName,
        schedule,
        attributes
    };
}

var User = /*#__PURE__*/Object.freeze({
    createUser: createUser
});

const USER_KEY = 'user';
const OUTPUT_LOG$1 = 'db.user.log';

function setupDatabase$1(db)
{
    if (!(USER_KEY in db))
    {
        db[USER_KEY] = new Map();
    }
    return db;
}

function clearDatabase$1(db)
{
    if (USER_KEY in db)
    {
        db[USER_KEY].clear();
    }
    return db;
}

function addUser(db, userID, ownerKey, userName, startDate, endDate, opts, attributes = {})
{
    const userMapping = db[USER_KEY];

    if (userMapping.has(userID))
    {
        db.throwError(USER_KEY, `Found duplicate id for user '${userID}'.`);
        return null;
    }
    else
    {
        // Create user...
        const user = createUser(userID, ownerKey, userName, startDate, endDate, opts, attributes);
        userMapping.set(userID, user);
        return user;
    }
}

function getUsers(db)
{
    return db[USER_KEY].keys();
}

function getUserCount(db)
{
    return db[USER_KEY].size;
}

function getUserByID(db, id)
{
    return db[USER_KEY].get(id);
}

/**
 * @param {Database} db The database to search through.
 * @param {String} ownerKey The owner key associated with the user.
 * @returns {String} The user id, null if not found.
 */
function getUserByOwnerKey(db, ownerKey)
{
    const userMapping = db[USER_KEY];
    for(const userData of userMapping.values())
    {
        if (Array.isArray(userData.ownerKey))
        {
            if (userData.ownerKey.includes(ownerKey))
            {
                return userData.id;
            }
        }
        else if (userData.ownerKey == ownerKey)
        {
            return userData.id;
        }
    }
    return null;
}

function getUsersByAttribute(db, attributeName, attributeValue)
{
    let result = [];
    const userMapping = db[USER_KEY];
    for(const userData of userMapping.values())
    {
        if (attributeName in userData.attributes)
        {
            const attributeData = userData.attributes[attributeName];
            if (Array.isArray(attributeData))
            {
                if (attributeData.includes(attributeValue))
                {
                    result.push(userData.id);
                }
            }
            else if (attributeData == attributeValue)
            {
                result.push(userData.id);
            }
        }
        else if (attributeValue === null)
        {
            result.push(userData.id);
        }
    }
    return result;
}

function getOwnerKeysForUserID(db, userID)
{
    const userMapping = db[USER_KEY];
    const userData = userMapping.get(userID);
    
    const result = userData.ownerKey;
    if (Array.isArray(result)) return result;
    else return [result];
}

function outputLog$1(db, outputFunction, outputDir = '.')
{
    const userMapping = db[USER_KEY];
    const result = {};
    for(const [key, value] of userMapping.entries())
    {
        result[key] = value;
    }

    const header = `${'# '.repeat(20)}\n# Users\n# Size: ${userMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    return outputFunction(require('path').resolve(outputDir, OUTPUT_LOG$1), log);
}

var UserDatabase$1 = /*#__PURE__*/Object.freeze({
    USER_KEY: USER_KEY,
    setupDatabase: setupDatabase$1,
    clearDatabase: clearDatabase$1,
    addUser: addUser,
    getUsers: getUsers,
    getUserCount: getUserCount,
    getUserByID: getUserByID,
    getUserByOwnerKey: getUserByOwnerKey,
    getUsersByAttribute: getUsersByAttribute,
    getOwnerKeysForUserID: getOwnerKeysForUserID,
    outputLog: outputLog$1
});

/**
 * @param {String} submissionID A globally unique identifier for this submission data object.
 * @param {String} ownerKey The owner of the submission.
 * @param {String} assignmentID The assignment the submission is for.
 * @param {Date} submitDate The date the submission was submitted.
 * @param {Object} attributes Any additional properties.
 * @returns {Submission} The submission data object.
 */
function createSubmission(submissionID, ownerKey, assignmentID, submitDate, attributes={})
{
    return {
        id: submissionID,
        owner: ownerKey,
        assignment: assignmentID,
        date: submitDate,
        attributes,
    };
}

var Submission = /*#__PURE__*/Object.freeze({
    createSubmission: createSubmission
});

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

function clearDatabase$2(db)
{
    if (SUBMISSION_KEY in db)
    {
        db[SUBMISSION_KEY][SUBMISSION_OWNER_KEY].clear();
        db[SUBMISSION_KEY][SUBMISSION_LIST_KEY].clear();
    }
    return db;
}

function addSubmission(db, submissionID, ownerKey, assignmentID, submissionDate, attributes={})
{
    const submissionMapping = db[SUBMISSION_KEY];
    const submissionOwnerMapping = submissionMapping[SUBMISSION_OWNER_KEY];
    const submissionListMapping = submissionMapping[SUBMISSION_LIST_KEY];

    if (!submissionListMapping.has(submissionID))
    {
        // Make sure that owner key is NOT an array... otherwise pick an arbitrary one.
        if (Array.isArray(ownerKey)) ownerKey = ownerKey[0];

        // Create submission...
        const submission = createSubmission(submissionID, ownerKey, assignmentID, submissionDate, attributes);

        // Get assigned submission list by owner...
        let assignedSubmissions = submissionOwnerMapping.get(ownerKey);
        if (!assignedSubmissions) submissionOwnerMapping.set(ownerKey, assignedSubmissions = {});

        // Add submission to the correct assignment submissions list AND in proper order...
        addSubmissionToAssignment(submission, assignmentID, assignedSubmissions);

        // Add submission to submissions list
        submissionListMapping.set(submissionID, submission);

        return submission;
    }
    else
    {
        db.throwError(SUBMISSION_KEY, `Found duplicate id for submission '${submissionID}'.`);
        return null;
    }
}

/**
 * Adds the submission to the appropriate assignment submissions list and insert in proper order.
 * @private
 * @param {Submission} submission The submission data object.
 * @param {String} assignmentID The assignment id to add the submission to. This should be the same as the assignment field in the submission object.
 * @param {Object} assignedSubmissions The assignment-submissions mapping to add to.
 * @returns {Submission} The submission added.
 */
function addSubmissionToAssignment(submission, assignmentID, assignedSubmissions)
{
    // Makes sure the submission has the same assignment.
    submission.assignment = assignmentID;

    // If there exists submissions by the owner for this assignment already...
    if (assignmentID in assignedSubmissions)
    {
        // Get the other submissions already processed for the same assignment...
        const submissions = assignedSubmissions[assignmentID];

        // Insert into appropriate order...
        let i = 0;
        for(; i < submissions.length; ++i)
        {
            if (compareDates(submission.date, submissions[i].date) < 0)
            {
                break;
            }
        }

        // Insert submission for assignment...
        submissions.splice(i, 0, submission);
    }
    else
    {
        // Add new submission for assignment...
        assignedSubmissions[assignmentID] = [submission];
    }

    return submission;
}

/**
 * Assumes the submission has already been successfully inserted into the database.
 * @param {Database} db The database to change submission for.
 * @param {Submission} submission The submission data object to change assignment for.
 * @param {String} [newAssignmentID] The assignment to change the submission to. If not
 * specified, will not add the submission back into assignments.
 * @returns {Submission} The changed submission.
 */
function changeSubmissionAssignment(db, submission, newAssignmentID=undefined)
{
    const submissionOwnerMapping = db[SUBMISSION_KEY][SUBMISSION_OWNER_KEY];
    const assignedSubmissions = submissionOwnerMapping.get(submission.owner);
    const submissions = assignedSubmissions[submission.assignment];
    const submissionIndex = submissions.indexOf(submission);
    if (submissionIndex >= 0)
    {
        submissions.splice(submissionIndex, 1);
        if (submissions.length <= 0)
        {
            delete assignedSubmissions[submission.assignment];
        }
    }
    else
    {
        throw new Error(`Cannot find submission for assignment ${submission.assignment}.`);
    }

    if (typeof newAssignmentID !== 'undefined')
    {
        addSubmissionToAssignment(submission, newAssignmentID, assignedSubmissions);
    }
    return submission;
}

/**
 * Gets an array of submission belonging to the owner.
 * @param {Database} db The database to search through.
 * @param {String} ownerKey The owner key to search by (is not the same as user id).
 * @returns {Array<Submission>} An array of the owner's submissions, null if owner not found.
 */
function getAssignedSubmissionsByOwnerKey(db, ownerKey)
{
    return db[SUBMISSION_KEY][SUBMISSION_OWNER_KEY].get(ownerKey);
}

function getSubmissionByID(db, submissionID)
{
    return db[SUBMISSION_KEY][SUBMISSION_LIST_KEY].get(submissionID);
}

/**
 * Gets an iterable of all registered owners with submissions.
 * @param {Database} db The database to search through.
 * @returns {Iterable<String>} An iterable of owner ids.
 */
function getOwners(db)
{
    return db[SUBMISSION_KEY][SUBMISSION_OWNER_KEY].keys();
}

/**
 * Gets an iterable of all registered submissions.
 * @param {Database} db The database to search through.
 * @returns {Iterable<String>} An iterable of submission ids.
 */
function getSubmissions(db)
{
    return db[SUBMISSION_KEY][SUBMISSION_LIST_KEY].keys();
}

function getSubmissionCount(db)
{
    return db[SUBMISSION_KEY][SUBMISSION_LIST_KEY].size;
}

function clearSubmissionsByOwner(db, ownerKey)
{
    // Remove from list mapping...
    const submissionListMapping = db[SUBMISSION_KEY][SUBMISSION_LIST_KEY];
    const assignedSubmissions = getAssignedSubmissionsByOwnerKey(db, ownerKey);
    if (assignedSubmissions)
    {
        for(const submissions of Object.values(assignedSubmissions))
        {
            for(const submission of submissions)
            {
                submissionListMapping.delete(submission.id);
            }
        }
    }
    // Remove from owner mapping...
    const submissionOwnerMapping = db[SUBMISSION_KEY][SUBMISSION_OWNER_KEY];
    submissionOwnerMapping.delete(ownerKey);
}

function removeSubmissionByID(db, submissionID)
{
    // Remove from list mapping...
    const submissionListMapping = db[SUBMISSION_KEY][SUBMISSION_LIST_KEY];
    const submission = submissionListMapping.get(submissionID);
    if (!submission)
    {
        throw new Error(`Cannot find submission for id ${submissionID}.`);
    }
    submissionListMapping.delete(submissionID);

    // Remove from owner mapping...
    // This acts like a remove when no new assignment id is specified.
    changeSubmissionAssignment(db, submission);
}

function outputLog$2(db, outputFunction, outputDir = '.')
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
    return outputFunction(require('path').resolve(outputDir, OUTPUT_LOG$2), log);
}

var SubmissionDatabase = /*#__PURE__*/Object.freeze({
    SUBMISSION_KEY: SUBMISSION_KEY,
    SUBMISSION_OWNER_KEY: SUBMISSION_OWNER_KEY,
    SUBMISSION_LIST_KEY: SUBMISSION_LIST_KEY,
    setupDatabase: setupDatabase$2,
    clearDatabase: clearDatabase$2,
    addSubmission: addSubmission,
    addSubmissionToAssignment: addSubmissionToAssignment,
    changeSubmissionAssignment: changeSubmissionAssignment,
    getAssignedSubmissionsByOwnerKey: getAssignedSubmissionsByOwnerKey,
    getSubmissionByID: getSubmissionByID,
    getOwners: getOwners,
    getSubmissions: getSubmissions,
    getSubmissionCount: getSubmissionCount,
    clearSubmissionsByOwner: clearSubmissionsByOwner,
    removeSubmissionByID: removeSubmissionByID,
    outputLog: outputLog$2
});

function createReview(reviewID, reviewDate, comment, type, params)
{
    return {
        id: reviewID,
        date: reviewDate,
        comment,
        type,
        params
    };
}

var Review = /*#__PURE__*/Object.freeze({
    createReview: createReview
});

/**
 * The key for the database to access Review data.
 */
const REVIEW_KEY = 'review';

/**
 * The name of the output log for this data.
 */
const OUTPUT_LOG$3 = 'db.review.log';

/**
 * Prepares the database to be used for reviews.
 * @param {Database} db The database to prepare the sub-database for.
 */
function setupDatabase$3(db)
{
    if (!(REVIEW_KEY in db))
    {
        db[REVIEW_KEY] = new Map();
    }
    return db;
}

function clearDatabase$3(db)
{
    if (REVIEW_KEY in db)
    {
        db[REVIEW_KEY].clear();
    }
    return db;
}

function forEach(db, callback)
{
    db[REVIEW_KEY].forEach(callback);
}

/**
 * Adds a review, by id, with the specified attributes.
 * @param {Database} db The current database to add to.
 * @param {*} reviewID The associated unique id for the review.
 * @param {Date} reviewDate The date the review was created.
 * @param {String} comment Comments related to this review.
 * @param {String} type The type of review. This is usually associated with a reviewer script.
 * @param {Array} params A variable length array of parameters for the review.
 */
function addReview(db, reviewID, reviewDate, comment, type, params)
{
    const reviewMapping = db[REVIEW_KEY];

    if (reviewMapping.has(reviewID))
    {
        db.throwError(REVIEW_KEY, `Found duplicate id for review '${reviewID}'.`);
        return null;
    }
    else
    {
        const review = createReview(reviewID, reviewDate, comment, type, params);
        reviewMapping.set(String(reviewID), review);
        return review;
    }
}

function removeReviewByID(db, reviewID)
{
    const key = String(reviewID);
    const reviewMapping = db[REVIEW_KEY];
    if (reviewMapping.has(key))
    {
        reviewMapping.delete(key);
        return true;
    }
    else
    {
        return false;
    }
}

function getReviews(db)
{
    return db[REVIEW_KEY].keys();
}

function getReviewCount(db)
{
    return db[REVIEW_KEY].size;
}

function getReviewByID(db, reviewID)
{
    return db[REVIEW_KEY].get(String(reviewID));
}

function getReviewTypes(db)
{
    const reviewMapping = db[REVIEW_KEY];
    const dst = new Set();
    for(const review of reviewMapping.values())
    {
        dst.add(review.type);
    }
    return dst;
}

/**
 * Outputs all information related to reviews in this database.
 * @param {Database} db The current database.
 * @param {String} outputDir The output directory that will contain the output log.
 */
function outputLog$3(db, outputFunction, outputDir = '.')
{
    const reviewMapping = db[REVIEW_KEY];
    const result = {};
    for(const [key, value] of reviewMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Reviews\n# Size: ${reviewMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    return outputFunction(require('path').resolve(outputDir, OUTPUT_LOG$3), log);
}

var ReviewDatabase = /*#__PURE__*/Object.freeze({
    REVIEW_KEY: REVIEW_KEY,
    setupDatabase: setupDatabase$3,
    clearDatabase: clearDatabase$3,
    forEach: forEach,
    addReview: addReview,
    removeReviewByID: removeReviewByID,
    getReviews: getReviews,
    getReviewCount: getReviewCount,
    getReviewByID: getReviewByID,
    getReviewTypes: getReviewTypes,
    outputLog: outputLog$3
});

function computeDatesWithPadding(padding, startDate, endDate)
{
    switch(padding)
    {
        case 'week':
            const pastSunday = getPastSunday(startDate);
            const nextSunday = getNextEffectiveSunday(endDate, 3);
            return [pastSunday, nextSunday];
        default:
            const days = Number(padding);
            if (Number.isNaN(days))
            {
                throw new Error(`Unknown padding type '${padding}'.`);
            }
            else
            {
                return [new Date(startDate.getTime() - ONE_DAYTIME * days), new Date(endDate.getTime() + ONE_DAYTIME * days)];
            }
    }
}

/**
 * Creates a vacation object.
 * @param {*} vacationID The globally unique vacation id.
 * @param {String} ownerKey The key for the owner of the vacation.
 * @param {Date} startDate The date the vacation starts from.
 * @param {Date} endDate The date the vacation ends on.
 * @param {String|Number} padding The padding around the vacation days.
 * @param {Object} attributes Any additional information about the vacation.
 * @returns {Object} The vacation data object.
 */
function createVacation(vacationID, ownerKey, startDate, endDate, padding, attributes)
{
    const [newStartDate, newEndDate] = computeDatesWithPadding(padding, startDate, endDate);
    return {
        id: vacationID,
        ownerKey,
        // Dates defined by user. Use this for user-sensitive calculations.
        userStartDate: startDate,
        userEndDate: endDate,
        // Dates with padding accounted for. Use this when determining active work days.
        effectiveStartDate: newStartDate,
        effectiveEndDate: newEndDate,
        padding: padding,
        duration: getDaysUntil(startDate, endDate),
        attributes
    };
}

var Vacation = /*#__PURE__*/Object.freeze({
    createVacation: createVacation
});

/**
 * This database does not have a "source" data file, it instead
 * comes from the reviews in the ReviewDatabase. Refer to the
 * VacationLoader for more info.
 * 
 * @module VacationDatabase
 */

const VACATION_KEY = 'vacation';
const OUTPUT_LOG$4 = 'db.vacation.log';

function setupDatabase$4(db)
{
    if (!(VACATION_KEY in db))
    {
        db[VACATION_KEY] = new Map();
    }
    return db;
}

function clearDatabase$4(db)
{
    if (VACATION_KEY in db)
    {
        db[VACATION_KEY].clear();
    }
    return db;
}

function addVacation(db, vacationID, ownerKey, startDate, endDate=startDate, padding=0, attributes = {})
{
    const vacationMapping = db[VACATION_KEY];

    if (vacationMapping.has(vacationID))
    {
        db.throwError(VACATION_KEY, `Found duplicate id for vacation '${vacationID}'.`);
        return null;
    }
    else
    {
        // Create vacation...
        const vacation = createVacation(vacationID, ownerKey, startDate, endDate, padding, attributes);
        vacationMapping.set(vacationID, vacation);
        return vacation;
    }
}

/**
 * Assumes all vacations are disjoint. In other words, they do not overlap.
 * @param {Database} db The database to work off with.
 * @param {Array<String>} ownerKeys All associated owners that we want to find vacations from.
 * @param {Date} date The date to offset.
 */
function offsetDateByVacations(db, ownerKeys, date)
{
    const vacationMapping = db[VACATION_KEY];
    const vacations = getVacationsByOwnerKeys(db, ownerKeys);
    vacations.sort((a, b) => vacationMapping.get(a).effectiveStartDate.getTime() - vacationMapping.get(b).effectiveStartDate.getTime());

    let result = new Date(date.getTime());
    for(const vacationID of vacations)
    {
        const vacation = vacationMapping.get(vacationID);
        if (isWithinDates(result, vacation.effectiveStartDate, vacation.effectiveEndDate))
        {
            const days = getDaysUntil(result, vacation.effectiveStartDate);
            result.setTime(result.getTime() + days * ONE_DAYTIME);
        }
    }
    return result;
}

function getVacations(db)
{
    return db[VACATION_KEY].keys();
}

function getVacationByID(db, id)
{
    return db[VACATION_KEY].get(id);
}

/**
 * Finds all vacations belonging to the passed-in owners.
 * @param {Database} db The database to add vacations to.
 * @param {Array<String>} ownerKeys The owner keys.
 * @returns {Array} The vacations associated to the owner keys.
 */
function getVacationsByOwnerKeys(db, ownerKeys)
{
    const vacationMapping = db[VACATION_KEY];
    const result = [];
    for(const vacationData of vacationMapping.values())
    {
        if (ownerKeys.includes(vacationData.ownerKey))
        {
            result.push(vacationData.id);
        }
    }
    return result;
}

function getVacationsByAttribute(db, attributeName, attributeValue)
{
    let result = [];
    const vacationMapping = db[VACATION_KEY];
    for(const vacationData of vacationMapping.values())
    {
        if (attributeName in vacationData.attributes)
        {
            const attributeData = vacationData.attributes[attributeName];
            if (Array.isArray(attributeData))
            {
                if (attributeData.includes(attributeValue))
                {
                    result.push(vacationData.id);
                }
            }
            else if (attributeData == attributeValue)
            {
                result.push(vacationData.id);
            }
        }
        else if (attributeValue === null)
        {
            result.push(vacationData.id);
        }
    }
    return result;
}

function outputLog$4(db, outputFunction, outputDir = '.')
{
    const vacationMapping = db[VACATION_KEY];
    const result = {};
    for(const [key, value] of vacationMapping.entries())
    {
        result[key] = value;
    }

    const header = `${'# '.repeat(20)}\n# Vacations\n# Size: ${vacationMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    return outputFunction(require('path').resolve(outputDir, OUTPUT_LOG$4), log);
}

var VacationDatabase = /*#__PURE__*/Object.freeze({
    VACATION_KEY: VACATION_KEY,
    setupDatabase: setupDatabase$4,
    clearDatabase: clearDatabase$4,
    addVacation: addVacation,
    offsetDateByVacations: offsetDateByVacations,
    getVacations: getVacations,
    getVacationByID: getVacationByID,
    getVacationsByOwnerKeys: getVacationsByOwnerKeys,
    getVacationsByAttribute: getVacationsByAttribute,
    outputLog: outputLog$4
});

/**
 * This file handles setting up and clearing the database.
 * 
 * @module DatabaseSetup
 */

async function setupDatabase$5(config)
{
    const db = createDatabase();

    // HACK: How do people access today's date?
    let currentDate;
    if ('currentDate' in config)
    {
        currentDate = parse(config.currentDate);
    }
    else
    {
        currentDate = new Date(Date.now());
    }
    db.currentDate = currentDate;
    
    // Actually setup the databases...
    setupDatabase$1(db);
    setupDatabase$2(db);
    setupDatabase(db);
    setupDatabase$3(db);
    setupDatabase$4(db);

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
async function clearDatabase$5(db, config)
{
    clearDatabase$1(db);
    clearDatabase$2(db);
    clearDatabase(db);
    clearDatabase$3(db);
    clearDatabase$4(db);
    db.clearErrors();

    return db;
}

var DatabaseSetup = /*#__PURE__*/Object.freeze({
    setupDatabase: setupDatabase$5,
    clearDatabase: clearDatabase$5
});

/**
 * This file generates the dates for assignments
 * with respect to schedules and vacations.
 * 
 * @module DateGenerator
 */

const DEFAULT_VALIDATOR = (date) => {
    return date;
};

function createDateRange(fromDate, toDate)
{
    return [copyDate(fromDate), copyDate(toDate)];
}

function copyDateRange(dateRange)
{
    return [copyDate(dateRange[0]), copyDate(dateRange[1])];
}

function sortDateRanges(dateRanges)
{
    dateRanges.sort((a, b) => a[0].getTime() - b[0].getTime());
}

/**
 * Merge date ranges that overlap. This assumes the ranges are in order of start date.
 */
function mergeDateRangesWithOverlap(dateRanges, contiguous = true)
{
    let prevDateRange = null;
    for(let i = 0; i < dateRanges.length; ++i)
    {
        let dateRange = dateRanges[i];
        if (!prevDateRange)
        {
            prevDateRange = dateRange;
        }
        // If date ranges overlap if the end date is past the other start date,
        // OR if they are continguous (optional).
        else if (compareDates(prevDateRange[1], dateRange[0]) >= (contiguous ? -1 : 0))
        {
            // Merge the two ranges...
            prevDateRange[1].setTime(dateRange[1].getTime());
            // Delete the smaller one...
            dateRanges.splice(i, 1);
            // Decrement back one due to removal...
            --i;
        }
    }
}

/**
 * Expand or remove date ranges into effective work weeks.
 * A week is effective if it occupies at least 3 of the work days,
 * not including Sunday or Saturday.
 */
function convertDateRangesToEffectiveWorkWeeks(dateRanges, dst = [])
{
    for(const dateRange of dateRanges)
    {
        // If the range is too small, it can never possibly occupy 3 or more work days...
        if (getDaysUntil(dateRange[0], dateRange[1]) < 3)
        {
            continue;
        }
        else
        {
            // Mon, Tues, Wed, will create effective work week.
            const startDate = getNearestSunday(dateRange[0], true);
            // Wed, Thurs, Fri, will create effective work week.
            const endDate = getNearestSunday(dateRange[1], false);
            // Neither start nor end date could become an effective week...
            if (compareDates(startDate, endDate) === 0)
            {
                continue;
            }
            else
            {
                // The end date should always be a Saturday.
                dst.push([startDate, offsetDate(endDate, -1)]);
            }
        }
    }

    mergeDateRangesWithOverlap(dst);

    // HACK: To get assignments to be due BEFORE the vacation:
    // Shave off the Sunday of every starting vacation
    // Since it's expected the previous week to be an effective work week,
    // any assignments due would be on the first Sunday before the vacation.
    for(const dateRange of dst)
    {
        // Offset by 1 day, since every "week" starts on a Sunday.
        // and ends on a Saturday.
        dateRange[0] = offsetDate(dateRange[0], 1);
        dateRange[1] = offsetDate(dateRange[1], 1);
    }

    return dst;
}

/** Assumes date ranges do not overlap and are sorted. */
function createOffsetDelayValidator(invalidDateRanges = [])
{
    return function OffsetDelayValidator(date)
    {
        let result = copyDate(date);
        for(const dateRange of invalidDateRanges)
        {
            // Since date ranges are sorted, all ranges afterwards are all greater than the date time.
            // Therefore no collision is possible.
            if (result.getTime() < dateRange[0].getTime()) break;

            if (isWithinDates(result, dateRange[0], dateRange[1]))
            {
                const offset = getDaysUntil(dateRange[0], result) + 1;
                result = offsetDate(dateRange[1], offset);
            }
        }
        return result;
    };
}

/**
 * Generate a valid date.
 * @param {Date} date The date to generate.
 * @param {Function} [validator] The validator to get a valid date
 * given another date. These effectively allows vacations to be implemented.
 * @returns {Date} A valid date.
 */
function generateDate(date, validator = DEFAULT_VALIDATOR)
{
    return validator(date);
}

/**
 * Generate valid weekly dates.
 * @param {Date} startDate The date to start on or after.
 * @param {Date} endDate The date to end on or before.
 * @param {Function} [validator] The validator to get a valid date
 * given another date. These effectively allows vacations to be implemented.
 * @returns {Array<Date>} An array of valid dates for each week on the day
 * between the start and end dates.
 */
function generateWeeklySunday(startDate, endDate, validator = DEFAULT_VALIDATOR)
{
    const result = [];

    // Get the following Sunday of the effective week...
    const effectiveStartSunday = offsetDate(getNearestSunday(startDate, true), DAYS_IN_WEEK);

    // Make sure its a valid date...
    let date = validator(effectiveStartSunday);
    while(compareDates(date, endDate) <= 0)
    {
        result.push(date);

        // Move to the next Sunday, but make sure it's still valid...
        date = validator(getNextSunday(date));
    }

    return result;
}

var DateGenerator = /*#__PURE__*/Object.freeze({
    createDateRange: createDateRange,
    copyDateRange: copyDateRange,
    sortDateRanges: sortDateRanges,
    mergeDateRangesWithOverlap: mergeDateRangesWithOverlap,
    convertDateRangesToEffectiveWorkWeeks: convertDateRangesToEffectiveWorkWeeks,
    createOffsetDelayValidator: createOffsetDelayValidator,
    generateDate: generateDate,
    generateWeeklySunday: generateWeeklySunday
});

function parseName(value)
{
    return value;
}

function parseEmail(value, ...values)
{
    const result = value.split(',').map(e => {
        if (e) return e.trim().toLowerCase();
    });
    if (values.length > 0)
    {
        for(const nextValue of values)
        {
            const nextResults = parseEmail(nextValue);
            if (Array.isArray(nextResults))
            {
                for(const nextResult of nextResults)
                {
                    result.push(nextResult);
                }
            }
            else
            {
                result.push(nextResults);
            }
        }
    }

    if (result.length === 1) return result[0];
    else return result;
}

var FieldParser = /*#__PURE__*/Object.freeze({
    parseName: parseName,
    parseEmail: parseEmail
});

const chalk = require('chalk');

const MOTIVATIONS = [
    "I believe in you.",
    "You are almost there.",
    "I'm an otter...if you didn't know.",
    "Have a hug. <3",
    "Clam's are good.",
    "It's okay. You'll make progress!",
    "At least it's something.",
    "A lot of progress, you'll make.",
    "Don't worry. I got your back.",
    "You are doing good. Keep it up!",
    "You can do this.",
    "Sometimes, I just want to eat clams.",
    "Uh oh. That doesn't look good.",
    "Are you okay?",
    "Have you seen any clams around here?",
    "Found any clams lately?",
    "I like clams.",
    "I got 3 words: Giant. Clams.",
    "I hope this is helpful.",
    "It's better to get an error than to get nothing.",
    "I wonder if clams dream about me.",
    "Clams?",
    "I thought you were gone forever.",
    "Take a break. You deserve it.",
    "Come back in a few minutes. I know you can do it.",
    "Come back in a couple. I'll be here.",
    "That was unexpected.",
    "That's weird.",
    "Where did that come from?",
    "We can share the clam.",
    "I think...I am a clam-lover.",
    "Who's jgs?",
    "When life gives you lemons, you gotta eat another clam.",
    "Is it Friday?",
    "I wonder who writes these.",
    "I hope that's not too bad.",
    "Nothing to be done.",
    "Together at last!",
    "Yes, let's go . . .",
    "We're gonna need a bigger terminal",
    "I have a good feeling about this.",
    "I wonder where clams go?",
    "Thanks for keeping me company.",
    "I never noticed...Am I green?",
    "I got a tail, and I'm not afraid to use it.",
    "In the beginning, we were all just dots and lines. Now, I'm otter.",
    "Aren't you glad to see me? Cause I am.",
    "Nice to see you again.",
    "Haven't seen you around these parts before...Nah, I'm kidding.",
    "Welcome back.",
    "I wonder what's out there.",
    "Am I floating?",
    "Can I breathe?",
];

function getMotivation(index = -1)
{
    if (index < 0 || index >= MOTIVATIONS.length)
    {
        index = Math.floor(Math.random() * MOTIVATIONS.length);
    }
    return MOTIVATIONS[index];
}

function say(message = "...")
{
    console.log(chalk.green(otter(message)));
}

function otter(message)
{
    return `
     .-"""-.
    /      o\\     ${message}
   |    o   0).-.
   |       .-;(_/     .-.
    \\     /  /)).---._|  \`\\   ,
     '.  '  /((       \`'-./ _/|
       \\  .'  )        .-.;\`  /
        '.             |  \`\\-'
          '._        -'    /
    jgs      \`\`""--\`------\`
    `;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var symbols = createCommonjsModule(function (module) {

const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';

const windows = {
  bullet: '•',
  check: '√',
  cross: '×',
  ellipsis: '...',
  heart: '❤',
  info: 'i',
  line: '─',
  middot: '·',
  minus: '－',
  plus: '＋',
  question: '?',
  questionSmall: '﹖',
  pointer: '>',
  pointerSmall: '»',
  warning: '‼'
};

const other = {
  ballotCross: '✘',
  bullet: '•',
  check: '✔',
  cross: '✖',
  ellipsis: '…',
  heart: '❤',
  info: 'ℹ',
  line: '─',
  middot: '·',
  minus: '－',
  plus: '＋',
  question: '?',
  questionFull: '？',
  questionSmall: '﹖',
  pointer: isLinux ? '▸' : '❯',
  pointerSmall: isLinux ? '‣' : '›',
  warning: '⚠'
};

module.exports = isWindows ? windows : other;
Reflect.defineProperty(module.exports, 'windows', { enumerable: false, value: windows });
Reflect.defineProperty(module.exports, 'other', { enumerable: false, value: other });
});

const colors = { enabled: true, visible: true, styles: {}, keys: {} };

if ('FORCE_COLOR' in process.env) {
  colors.enabled = process.env.FORCE_COLOR !== '0';
}

const ansi = style => {
  style.open = `\u001b[${style.codes[0]}m`;
  style.close = `\u001b[${style.codes[1]}m`;
  style.regex = new RegExp(`\\u001b\\[${style.codes[1]}m`, 'g');
  return style;
};

const wrap = (style, str, nl) => {
  let { open, close, regex } = style;
  str = open + (str.includes(close) ? str.replace(regex, close + open) : str) + close;
  // see https://github.com/chalk/chalk/pull/92, thanks to the
  // chalk contributors for this fix. However, we've confirmed that
  // this issue is also present in Windows terminals
  return nl ? str.replace(/\r?\n/g, `${close}$&${open}`) : str;
};

const style = (input, stack) => {
  if (input === '' || input == null) return '';
  if (colors.enabled === false) return input;
  if (colors.visible === false) return '';
  let str = '' + input;
  let nl = str.includes('\n');
  let n = stack.length;
  while (n-- > 0) str = wrap(colors.styles[stack[n]], str, nl);
  return str;
};

const define = (name, codes, type) => {
  colors.styles[name] = ansi({ name, codes });
  let t = colors.keys[type] || (colors.keys[type] = []);
  t.push(name);

  Reflect.defineProperty(colors, name, {
    get() {
      let color = input => style(input, color.stack);
      Reflect.setPrototypeOf(color, colors);
      color.stack = this.stack ? this.stack.concat(name) : [name];
      return color;
    }
  });
};

define('reset', [0, 0], 'modifier');
define('bold', [1, 22], 'modifier');
define('dim', [2, 22], 'modifier');
define('italic', [3, 23], 'modifier');
define('underline', [4, 24], 'modifier');
define('inverse', [7, 27], 'modifier');
define('hidden', [8, 28], 'modifier');
define('strikethrough', [9, 29], 'modifier');

define('black', [30, 39], 'color');
define('red', [31, 39], 'color');
define('green', [32, 39], 'color');
define('yellow', [33, 39], 'color');
define('blue', [34, 39], 'color');
define('magenta', [35, 39], 'color');
define('cyan', [36, 39], 'color');
define('white', [37, 39], 'color');
define('gray', [90, 39], 'color');
define('grey', [90, 39], 'color');

define('bgBlack', [40, 49], 'bg');
define('bgRed', [41, 49], 'bg');
define('bgGreen', [42, 49], 'bg');
define('bgYellow', [43, 49], 'bg');
define('bgBlue', [44, 49], 'bg');
define('bgMagenta', [45, 49], 'bg');
define('bgCyan', [46, 49], 'bg');
define('bgWhite', [47, 49], 'bg');

define('blackBright', [90, 39], 'bright');
define('redBright', [91, 39], 'bright');
define('greenBright', [92, 39], 'bright');
define('yellowBright', [93, 39], 'bright');
define('blueBright', [94, 39], 'bright');
define('magentaBright', [95, 39], 'bright');
define('cyanBright', [96, 39], 'bright');
define('whiteBright', [97, 39], 'bright');

define('bgBlackBright', [100, 49], 'bgBright');
define('bgRedBright', [101, 49], 'bgBright');
define('bgGreenBright', [102, 49], 'bgBright');
define('bgYellowBright', [103, 49], 'bgBright');
define('bgBlueBright', [104, 49], 'bgBright');
define('bgMagentaBright', [105, 49], 'bgBright');
define('bgCyanBright', [106, 49], 'bgBright');
define('bgWhiteBright', [107, 49], 'bgBright');

/* eslint-disable no-control-regex */
// this is a modified, optimized version of
// https://github.com/chalk/ansi-regex (MIT License)
const re = colors.ansiRegex = /[\u001b\u009b][[\]#;?()]*(?:(?:(?:[^\W_]*;?[^\W_]*)\u0007)|(?:(?:[0-9]{1,4}(;[0-9]{0,4})*)?[~0-9=<>cf-nqrtyA-PRZ]))/g;

colors.hasColor = colors.hasAnsi = str => {
  re.lastIndex = 0;
  return !!str && typeof str === 'string' && re.test(str);
};

colors.unstyle = str => {
  re.lastIndex = 0;
  return typeof str === 'string' ? str.replace(re, '') : str;
};

colors.none = colors.clear = colors.noop = str => str; // no-op, for programmatic usage
colors.stripColor = colors.unstyle;
colors.symbols = symbols;
colors.define = define;
var ansiColors = colors;

var utils = createCommonjsModule(function (module, exports) {

const toString = Object.prototype.toString;

let called = false;
let fns = [];

const complements = {
  'yellow': 'blue',
  'cyan': 'red',
  'green': 'magenta',
  'black': 'white',
  'blue': 'yellow',
  'red': 'cyan',
  'magenta': 'green',
  'white': 'black'
};

exports.longest = (arr, prop) => {
  return arr.reduce((a, v) => Math.max(a, prop ? v[prop].length : v.length), 0);
};

exports.hasColor = str => !!str && ansiColors.hasColor(str);

const isObject = exports.isObject = val => {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
};

exports.nativeType = val => {
  return toString.call(val).slice(8, -1).toLowerCase().replace(/\s/g, '');
};

exports.isAsyncFn = val => {
  return exports.nativeType(val) === 'asyncfunction';
};

exports.isPrimitive = val => {
  return val != null && typeof val !== 'object' && typeof val !== 'function';
};

exports.resolve = (context, value, ...rest) => {
  if (typeof value === 'function') {
    return value.call(context, ...rest);
  }
  return value;
};

exports.scrollDown = (choices = []) => [...choices.slice(1), choices[0]];
exports.scrollUp = (choices = []) => [choices.pop(), ...choices];

exports.reorder = (arr = []) => {
  let res = arr.slice();
  res.sort((a, b) => {
    if (a.index > b.index) return 1;
    if (a.index < b.index) return -1;
    return 0;
  });
  return res;
};

exports.swap = (arr, index, pos) => {
  let len = arr.length;
  let idx = pos === len ? 0 : pos < 0 ? len - 1 : pos;
  let choice = arr[index];
  arr[index] = arr[idx];
  arr[idx] = choice;
};

exports.width = (stream, fallback = 80) => {
  let columns = (stream && stream.columns) ? stream.columns : fallback;
  if (stream && typeof stream.getWindowSize === 'function') {
    columns = stream.getWindowSize()[0];
  }
  if (process.platform === 'win32') {
    return columns - 1;
  }
  return columns;
};

exports.height = (stream, fallback = 20) => {
  let rows = (stream && stream.rows) ? stream.rows : fallback;
  if (stream && typeof stream.getWindowSize === 'function') {
    rows = stream.getWindowSize()[1];
  }
  return rows;
};

exports.wordWrap = (str, options = {}) => {
  if (!str) return str;

  if (typeof options === 'number') {
    options = { width: options };
  }

  let { indent = '', newline = ('\n' + indent), width = 80 } = options;
  let spaces = (newline + indent).match(/[^\S\n]/g) || [];
  width -= spaces.length;
  let source = `.{1,${width}}([\\s\\u200B]+|$)|[^\\s\\u200B]+?([\\s\\u200B]+|$)`;
  let output = str.trim();
  let regex = new RegExp(source, 'g');
  let lines = output.match(regex) || [];
  lines = lines.map(line => line.replace(/\n$/, ''));
  if (options.padEnd) lines = lines.map(line => line.padEnd(width, ' '));
  if (options.padStart) lines = lines.map(line => line.padStart(width, ' '));
  return indent + lines.join(newline);
};

exports.unmute = color => {
  let name = color.stack.find(n => ansiColors.keys.color.includes(n));
  if (name) {
    return ansiColors[name];
  }
  let bg = color.stack.find(n => n.slice(2) === 'bg');
  if (bg) {
    return ansiColors[name.slice(2)];
  }
  return str => str;
};

exports.pascal = str => str ? str[0].toUpperCase() + str.slice(1) : '';

exports.inverse = color => {
  if (!color || !color.stack) return color;
  let name = color.stack.find(n => ansiColors.keys.color.includes(n));
  if (name) {
    let col = ansiColors['bg' + exports.pascal(name)];
    return col ? col.black : color;
  }
  let bg = color.stack.find(n => n.slice(0, 2) === 'bg');
  if (bg) {
    return ansiColors[bg.slice(2).toLowerCase()] || color;
  }
  return ansiColors.none;
};

exports.complement = color => {
  if (!color || !color.stack) return color;
  let name = color.stack.find(n => ansiColors.keys.color.includes(n));
  let bg = color.stack.find(n => n.slice(0, 2) === 'bg');
  if (name && !bg) {
    return ansiColors[complements[name] || name];
  }
  if (bg) {
    let lower = bg.slice(2).toLowerCase();
    let comp = complements[lower];
    if (!comp) return color;
    return ansiColors['bg' + exports.pascal(comp)] || color;
  }
  return ansiColors.none;
};

exports.meridiem = date => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  let hrs = hours === 0 ? 12 : hours;
  let min = minutes < 10 ? '0' + minutes : minutes;
  return hrs + ':' + min + ' ' + ampm;
};

/**
 * Set a value on the given object.
 * @param {Object} obj
 * @param {String} prop
 * @param {any} value
 */

exports.set = (obj = {}, prop = '', val) => {
  return prop.split('.').reduce((acc, k, i, arr) => {
    let value = arr.length - 1 > i ? (acc[k] || {}) : val;
    if (!exports.isObject(value) && i < arr.length - 1) value = {};
    return (acc[k] = value);
  }, obj);
};

/**
 * Get a value from the given object.
 * @param {Object} obj
 * @param {String} prop
 */

exports.get = (obj = {}, prop = '', fallback) => {
  let value = obj[prop] == null
    ? prop.split('.').reduce((acc, k) => acc && acc[k], obj)
    : obj[prop];
  return value == null ? fallback : value;
};

exports.mixin = (target, b) => {
  if (!isObject(target)) return b;
  if (!isObject(b)) return target;
  for (let key of Object.keys(b)) {
    let desc = Object.getOwnPropertyDescriptor(b, key);
    if (desc.hasOwnProperty('value')) {
      if (target.hasOwnProperty(key) && isObject(desc.value)) {
        let existing = Object.getOwnPropertyDescriptor(target, key);
        if (isObject(existing.value)) {
          target[key] = exports.merge({}, target[key], b[key]);
        } else {
          Reflect.defineProperty(target, key, desc);
        }
      } else {
        Reflect.defineProperty(target, key, desc);
      }
    } else {
      Reflect.defineProperty(target, key, desc);
    }
  }
  return target;
};

exports.merge = (...args) => {
  let target = {};
  for (let ele of args) exports.mixin(target, ele);
  return target;
};

exports.mixinEmitter = (obj, emitter) => {
  let proto = emitter.constructor.prototype;
  for (let key of Object.keys(proto)) {
    let val = proto[key];
    if (typeof val === 'function') {
      exports.define(obj, key, val.bind(emitter));
    } else {
      exports.define(obj, key, val);
    }
  }
};

exports.onExit = callback => {
  const onExit = (quit, code) => {
    if (called) return;

    called = true;
    fns.forEach(fn => fn());

    if (quit === true) {
      process.exit(128 + code);
    }
  };

  if (fns.length === 0) {
    process.once('SIGTERM', onExit.bind(null, true, 15));
    process.once('SIGINT', onExit.bind(null, true, 2));
    process.once('exit', onExit);
  }

  fns.push(callback);
};

exports.define = (obj, key, value) => {
  Reflect.defineProperty(obj, key, { value });
};

exports.defineExport = (obj, key, fn) => {
  let custom;
  Reflect.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    set(val) {
      custom = val;
    },
    get() {
      return custom ? custom() : fn();
    }
  });
};
});
var utils_1 = utils.longest;
var utils_2 = utils.hasColor;
var utils_3 = utils.isObject;
var utils_4 = utils.nativeType;
var utils_5 = utils.isAsyncFn;
var utils_6 = utils.isPrimitive;
var utils_7 = utils.resolve;
var utils_8 = utils.scrollDown;
var utils_9 = utils.scrollUp;
var utils_10 = utils.reorder;
var utils_11 = utils.swap;
var utils_12 = utils.width;
var utils_13 = utils.height;
var utils_14 = utils.wordWrap;
var utils_15 = utils.unmute;
var utils_16 = utils.pascal;
var utils_17 = utils.inverse;
var utils_18 = utils.complement;
var utils_19 = utils.meridiem;
var utils_20 = utils.set;
var utils_21 = utils.get;
var utils_22 = utils.mixin;
var utils_23 = utils.merge;
var utils_24 = utils.mixinEmitter;
var utils_25 = utils.onExit;
var utils_26 = utils.define;
var utils_27 = utils.defineExport;

/**
 * Actions are mappings from keypress event names to method names
 * in the prompts.
 */

var ctrl = {
  a: 'first',
  b: 'backward',
  c: 'cancel',
  d: 'deleteForward',
  e: 'last',
  f: 'forward',
  g: 'reset',
  i: 'tab',
  k: 'cutForward',
  l: 'reset',
  n: 'newItem',
  m: 'cancel',
  j: 'submit',
  p: 'search',
  r: 'remove',
  s: 'save',
  u: 'undo',
  w: 'cutLeft',
  x: 'toggleCursor',
  v: 'paste'
};

var shift = {
  up: 'shiftUp',
  down: 'shiftDown',
  left: 'shiftLeft',
  right: 'shiftRight',
  tab: 'prev'
};

var fn = {
  up: 'pageUp',
  down: 'pageDown',
  left: 'pageLeft',
  right: 'pageRight',
  delete: 'deleteForward'
};

// <alt> on Windows
var option$1 = {
  b: 'backward',
  f: 'forward',
  d: 'cutRight',
  left: 'cutLeft',
  up: 'altUp',
  down: 'altDown'
};

var keys = {
  pageup: 'pageUp', // <fn>+<up> (mac), <Page Up> (windows)
  pagedown: 'pageDown', // <fn>+<down> (mac), <Page Down> (windows)
  home: 'home', // <fn>+<left> (mac), <home> (windows)
  end: 'end', // <fn>+<right> (mac), <end> (windows)
  cancel: 'cancel',
  delete: 'deleteForward',
  backspace: 'delete',
  down: 'down',
  enter: 'submit',
  escape: 'cancel',
  left: 'left',
  space: 'space',
  number: 'number',
  return: 'submit',
  right: 'right',
  tab: 'next',
  up: 'up'
};

var combos = {
	ctrl: ctrl,
	shift: shift,
	fn: fn,
	option: option$1,
	keys: keys
};

/* eslint-disable no-control-regex */
const metaKeyCodeRe = /^(?:\x1b)([a-zA-Z0-9])$/;
const fnKeyRe = /^(?:\x1b+)(O|N|\[|\[\[)(?:(\d+)(?:;(\d+))?([~^$])|(?:1;)?(\d+)?([a-zA-Z]))/;
const keyName = {
    /* xterm/gnome ESC O letter */
    'OP': 'f1',
    'OQ': 'f2',
    'OR': 'f3',
    'OS': 'f4',
    /* xterm/rxvt ESC [ number ~ */
    '[11~': 'f1',
    '[12~': 'f2',
    '[13~': 'f3',
    '[14~': 'f4',
    /* from Cygwin and used in libuv */
    '[[A': 'f1',
    '[[B': 'f2',
    '[[C': 'f3',
    '[[D': 'f4',
    '[[E': 'f5',
    /* common */
    '[15~': 'f5',
    '[17~': 'f6',
    '[18~': 'f7',
    '[19~': 'f8',
    '[20~': 'f9',
    '[21~': 'f10',
    '[23~': 'f11',
    '[24~': 'f12',
    /* xterm ESC [ letter */
    '[A': 'up',
    '[B': 'down',
    '[C': 'right',
    '[D': 'left',
    '[E': 'clear',
    '[F': 'end',
    '[H': 'home',
    /* xterm/gnome ESC O letter */
    'OA': 'up',
    'OB': 'down',
    'OC': 'right',
    'OD': 'left',
    'OE': 'clear',
    'OF': 'end',
    'OH': 'home',
    /* xterm/rxvt ESC [ number ~ */
    '[1~': 'home',
    '[2~': 'insert',
    '[3~': 'delete',
    '[4~': 'end',
    '[5~': 'pageup',
    '[6~': 'pagedown',
    /* putty */
    '[[5~': 'pageup',
    '[[6~': 'pagedown',
    /* rxvt */
    '[7~': 'home',
    '[8~': 'end',
    /* rxvt keys with modifiers */
    '[a': 'up',
    '[b': 'down',
    '[c': 'right',
    '[d': 'left',
    '[e': 'clear',

    '[2$': 'insert',
    '[3$': 'delete',
    '[5$': 'pageup',
    '[6$': 'pagedown',
    '[7$': 'home',
    '[8$': 'end',

    'Oa': 'up',
    'Ob': 'down',
    'Oc': 'right',
    'Od': 'left',
    'Oe': 'clear',

    '[2^': 'insert',
    '[3^': 'delete',
    '[5^': 'pageup',
    '[6^': 'pagedown',
    '[7^': 'home',
    '[8^': 'end',
    /* misc. */
    '[Z': 'tab',
};

function isShiftKey(code) {
    return ['[a', '[b', '[c', '[d', '[e', '[2$', '[3$', '[5$', '[6$', '[7$', '[8$', '[Z'].includes(code)
}

function isCtrlKey(code) {
    return [ 'Oa', 'Ob', 'Oc', 'Od', 'Oe', '[2^', '[3^', '[5^', '[6^', '[7^', '[8^'].includes(code)
}

const keypress = (s = '', event = {}) => {
  let parts;
  let key = {
    name: event.name,
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
    sequence: s,
    raw: s,
    ...event
  };

  if (Buffer.isBuffer(s)) {
    if (s[0] > 127 && s[1] === void 0) {
      s[0] -= 128;
      s = '\x1b' + String(s);
    } else {
      s = String(s);
    }
  } else if (s !== void 0 && typeof s !== 'string') {
    s = String(s);
  } else if (!s) {
    s = key.sequence || '';
  }

  key.sequence = key.sequence || s || key.name;

  if (s === '\r') {
    // carriage return
    key.raw = void 0;
    key.name = 'return';
  } else if (s === '\n') {
    // enter, should have been called linefeed
    key.name = 'enter';
  } else if (s === '\t') {
    // tab
    key.name = 'tab';
  } else if (s === '\b' || s === '\x7f' || s === '\x1b\x7f' || s === '\x1b\b') {
    // backspace or ctrl+h
    key.name = 'backspace';
    key.meta = s.charAt(0) === '\x1b';
  } else if (s === '\x1b' || s === '\x1b\x1b') {
    // escape key
    key.name = 'escape';
    key.meta = s.length === 2;
  } else if (s === ' ' || s === '\x1b ') {
    key.name = 'space';
    key.meta = s.length === 2;
  } else if (s <= '\x1a') {
    // ctrl+letter
    key.name = String.fromCharCode(s.charCodeAt(0) + 'a'.charCodeAt(0) - 1);
    key.ctrl = true;
  } else if (s.length === 1 && s >= '0' && s <= '9') {
    // number
    key.name = 'number';
  } else if (s.length === 1 && s >= 'a' && s <= 'z') {
    // lowercase letter
    key.name = s;
  } else if (s.length === 1 && s >= 'A' && s <= 'Z') {
    // shift+letter
    key.name = s.toLowerCase();
    key.shift = true;
  } else if ((parts = metaKeyCodeRe.exec(s))) {
    // meta+character key
    key.meta = true;
    key.shift = /^[A-Z]$/.test(parts[1]);
  } else if ((parts = fnKeyRe.exec(s))) {
    let segs = [...s];

    if (segs[0] === '\u001b' && segs[1] === '\u001b') {
      key.option = true;
    }

    // ansi escape sequence
    // reassemble the key code leaving out leading \x1b's,
    // the modifier key bitflag and any meaningless "1;" sequence
    let code = [parts[1], parts[2], parts[4], parts[6]].filter(Boolean).join('');
    let modifier = (parts[3] || parts[5] || 1) - 1;

    // Parse the key modifier
    key.ctrl = !!(modifier & 4);
    key.meta = !!(modifier & 10);
    key.shift = !!(modifier & 1);
    key.code = code;

    key.name = keyName[code];
    key.shift = isShiftKey(code) || key.shift;
    key.ctrl = isCtrlKey(code) || key.ctrl;
  }
  return key;
};

keypress.listen = (options = {}, onKeypress) => {
  let { stdin } = options;

  if (!stdin || (stdin !== process.stdin && !stdin.isTTY)) {
    throw new Error('Invalid stream passed');
  }

  let rl = readline$1.createInterface({ terminal: true, input: stdin });
  readline$1.emitKeypressEvents(stdin, rl);

  let on = (buf, key) => onKeypress(buf, keypress(buf, key), rl);
  let isRaw = stdin.isRaw;

  if (stdin.isTTY) stdin.setRawMode(true);
  stdin.on('keypress', on);
  rl.resume();

  let off = () => {
    if (stdin.isTTY) stdin.setRawMode(isRaw);
    stdin.removeListener('keypress', on);
    rl.pause();
    rl.close();
  };

  return off;
};

keypress.action = (buf, key, customActions) => {
  let obj = { ...combos, ...customActions };
  if (key.ctrl) {
    key.action = obj.ctrl[key.name];
    return key;
  }

  if (key.option && obj.option) {
    key.action = obj.option[key.name];
    return key;
  }

  if (key.shift) {
    key.action = obj.shift[key.name];
    return key;
  }

  key.action = obj.keys[key.name];
  return key;
};

var keypress_1 = keypress;

var timer = prompt => {
  prompt.timers = prompt.timers || {};

  let timers = prompt.options.timers;
  if (!timers) return;

  for (let key of Object.keys(timers)) {
    let opts = timers[key];
    if (typeof opts === 'number') {
      opts = { interval: opts };
    }
    create(prompt, key, opts);
  }
};

function create(prompt, name, options = {}) {
  let timer = prompt.timers[name] = { name, start: Date.now(), ms: 0, tick: 0 };
  let ms = options.interval || 120;
  timer.frames = options.frames || [];
  timer.loading = true;

  let interval = setInterval(() => {
    timer.ms = Date.now() - timer.start;
    timer.tick++;
    prompt.render();
  }, ms);

  timer.stop = () => {
    timer.loading = false;
    clearInterval(interval);
  };

  Reflect.defineProperty(timer, 'interval', { value: interval });
  prompt.once('close', () => timer.stop());
  return timer.stop;
}

const { define: define$1, width } = utils;

class State {
  constructor(prompt) {
    let options = prompt.options;
    define$1(this, '_prompt', prompt);
    this.type = prompt.type;
    this.name = prompt.name;
    this.message = '';
    this.header = '';
    this.footer = '';
    this.error = '';
    this.hint = '';
    this.input = '';
    this.cursor = 0;
    this.index = 0;
    this.lines = 0;
    this.tick = 0;
    this.prompt = '';
    this.buffer = '';
    this.width = width(options.stdout || process.stdout);
    Object.assign(this, options);
    this.name = this.name || this.message;
    this.message = this.message || this.name;
    this.symbols = prompt.symbols;
    this.styles = prompt.styles;
    this.required = new Set();
    this.cancelled = false;
    this.submitted = false;
  }

  clone() {
    let state = { ...this };
    state.status = this.status;
    state.buffer = Buffer.from(state.buffer);
    delete state.clone;
    return state;
  }

  set color(val) {
    this._color = val;
  }
  get color() {
    let styles = this.prompt.styles;
    if (this.cancelled) return styles.cancelled;
    if (this.submitted) return styles.submitted;
    let color = this._color || styles[this.status];
    return typeof color === 'function' ? color : styles.pending;
  }

  set loading(value) {
    this._loading = value;
  }
  get loading() {
    if (typeof this._loading === 'boolean') return this._loading;
    if (this.loadingChoices) return 'choices';
    return false;
  }

  get status() {
    if (this.cancelled) return 'cancelled';
    if (this.submitted) return 'submitted';
    return 'pending';
  }
}

var state = State;

const styles = {
  default: ansiColors.noop,
  noop: ansiColors.noop,

  /**
   * Modifiers
   */

  set inverse(custom) {
    this._inverse = custom;
  },
  get inverse() {
    return this._inverse || utils.inverse(this.primary);
  },

  set complement(custom) {
    this._complement = custom;
  },
  get complement() {
    return this._complement || utils.complement(this.primary);
  },

  /**
   * Main color
   */

  primary: ansiColors.cyan,

  /**
   * Main palette
   */

  success: ansiColors.green,
  danger: ansiColors.magenta,
  strong: ansiColors.bold,
  warning: ansiColors.yellow,
  muted: ansiColors.dim,
  disabled: ansiColors.gray,
  dark: ansiColors.dim.gray,
  underline: ansiColors.underline,

  set info(custom) {
    this._info = custom;
  },
  get info() {
    return this._info || this.primary;
  },

  set em(custom) {
    this._em = custom;
  },
  get em() {
    return this._em || this.primary.underline;
  },

  set heading(custom) {
    this._heading = custom;
  },
  get heading() {
    return this._heading || this.muted.underline;
  },

  /**
   * Statuses
   */

  set pending(custom) {
    this._pending = custom;
  },
  get pending() {
    return this._pending || this.primary;
  },

  set submitted(custom) {
    this._submitted = custom;
  },
  get submitted() {
    return this._submitted || this.success;
  },

  set cancelled(custom) {
    this._cancelled = custom;
  },
  get cancelled() {
    return this._cancelled || this.danger;
  },

  /**
   * Special styling
   */

  set typing(custom) {
    this._typing = custom;
  },
  get typing() {
    return this._typing || this.dim;
  },

  set placeholder(custom) {
    this._placeholder = custom;
  },
  get placeholder() {
    return this._placeholder || this.primary.dim;
  },

  set highlight(custom) {
    this._highlight = custom;
  },
  get highlight() {
    return this._highlight || this.inverse;
  }
};

styles.merge = (options = {}) => {
  if (options.styles && typeof options.styles.enabled === 'boolean') {
    ansiColors.enabled = options.styles.enabled;
  }
  if (options.styles && typeof options.styles.visible === 'boolean') {
    ansiColors.visible = options.styles.visible;
  }

  let result = utils.merge({}, styles, options.styles);
  delete result.merge;

  for (let key of Object.keys(ansiColors)) {
    if (!result.hasOwnProperty(key)) {
      Reflect.defineProperty(result, key, { get: () => ansiColors[key] });
    }
  }

  for (let key of Object.keys(ansiColors.styles)) {
    if (!result.hasOwnProperty(key)) {
      Reflect.defineProperty(result, key, { get: () => ansiColors[key] });
    }
  }
  return result;
};

var styles_1 = styles;

const isWindows = process.platform === 'win32';



const symbols$1 = {
  ...ansiColors.symbols,
  upDownDoubleArrow: '⇕',
  upDownDoubleArrow2: '⬍',
  upDownArrow: '↕',
  asterisk: '*',
  asterism: '⁂',
  bulletWhite: '◦',
  electricArrow: '⌁',
  ellipsisLarge: '⋯',
  ellipsisSmall: '…',
  fullBlock: '█',
  identicalTo: '≡',
  indicator: ansiColors.symbols.check,
  leftAngle: '‹',
  mark: '※',
  minus: '−',
  multiplication: '×',
  obelus: '÷',
  percent: '%',
  pilcrow: '¶',
  pilcrow2: '❡',
  pencilUpRight: '✐',
  pencilDownRight: '✎',
  pencilRight: '✏',
  plus: '+',
  plusMinus: '±',
  pointRight: '☞',
  rightAngle: '›',
  section: '§',
  hexagon: { off: '⬡', on: '⬢', disabled: '⬢' },
  ballot: { on: '☑', off: '☐', disabled: '☒' },
  stars: { on: '★', off: '☆', disabled: '☆' },
  folder: { on: '▼', off: '▶', disabled: '▶' },
  prefix: {
    pending: ansiColors.symbols.question,
    submitted: ansiColors.symbols.check,
    cancelled: ansiColors.symbols.cross
  },
  separator: {
    pending: ansiColors.symbols.pointerSmall,
    submitted: ansiColors.symbols.middot,
    cancelled: ansiColors.symbols.middot
  },
  radio: {
    off: isWindows ? '( )' : '◯',
    on: isWindows ? '(*)' : '◉',
    disabled: isWindows ? '(|)' : 'Ⓘ'
  },
  numbers: ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳', '㉑', '㉒', '㉓', '㉔', '㉕', '㉖', '㉗', '㉘', '㉙', '㉚', '㉛', '㉜', '㉝', '㉞', '㉟', '㊱', '㊲', '㊳', '㊴', '㊵', '㊶', '㊷', '㊸', '㊹', '㊺', '㊻', '㊼', '㊽', '㊾', '㊿']
};

symbols$1.merge = options => {
  let result = utils.merge({}, ansiColors.symbols, symbols$1, options.symbols);
  delete result.merge;
  return result;
};

var symbols_1 = symbols$1;

var theme = prompt => {
  prompt.options = utils.merge({}, prompt.options.theme, prompt.options);
  prompt.symbols = symbols_1.merge(prompt.options);
  prompt.styles = styles_1.merge(prompt.options);
};

var ansi_1 = createCommonjsModule(function (module, exports) {

const isTerm = process.env.TERM_PROGRAM === 'Apple_Terminal';


const ansi = module.exports = exports;
const ESC = '\u001b[';
const BEL = '\u0007';
let hidden = false;

const code = ansi.code = {
  bell: BEL,
  beep: BEL,
  beginning: `${ESC}G`,
  down: `${ESC}J`,
  esc: ESC,
  getPosition: `${ESC}6n`,
  hide: `${ESC}?25l`,
  line: `${ESC}2K`,
  lineEnd: `${ESC}K`,
  lineStart: `${ESC}1K`,
  restorePosition: ESC + (isTerm ? '8' : 'u'),
  savePosition: ESC + (isTerm ? '7' : 's'),
  screen: `${ESC}2J`,
  show: `${ESC}?25h`,
  up: `${ESC}1J`
};

const cursor = ansi.cursor = {
  get hidden() {
    return hidden;
  },

  hide() {
    hidden = true;
    return code.hide;
  },
  show() {
    hidden = false;
    return code.show;
  },

  forward: (count = 1) => `${ESC}${count}C`,
  backward: (count = 1) => `${ESC}${count}D`,
  nextLine: (count = 1) => `${ESC}E`.repeat(count),
  prevLine: (count = 1) => `${ESC}F`.repeat(count),

  up: (count = 1) => count ? `${ESC}${count}A` : '',
  down: (count = 1) => count ? `${ESC}${count}B` : '',
  right: (count = 1) => count ? `${ESC}${count}C` : '',
  left: (count = 1) => count ? `${ESC}${count}D` : '',

  to(x, y) {
    return y ? `${ESC}${y + 1};${x + 1}H` : `${ESC}${x + 1}G`;
  },

  move(x = 0, y = 0) {
    let res = '';
    res += (x < 0) ? cursor.left(-x) : (x > 0) ? cursor.right(x) : '';
    res += (y < 0) ? cursor.up(-y) : (y > 0) ? cursor.down(y) : '';
    return res;
  },

  restore(state = {}) {
    let { after, cursor, initial, input, prompt, size, value } = state;
    initial = utils.isPrimitive(initial) ? String(initial) : '';
    input = utils.isPrimitive(input) ? String(input) : '';
    value = utils.isPrimitive(value) ? String(value) : '';

    if (size) {
      let codes = ansi.cursor.up(size) + ansi.cursor.to(prompt.length);
      let diff = input.length - cursor;
      if (diff > 0) {
        codes += ansi.cursor.left(diff);
      }
      return codes;
    }

    if (value || after) {
      let pos = (!input && !!initial) ? -initial.length : -input.length + cursor;
      if (after) pos -= after.length;
      if (input === '' && initial && !prompt.includes(initial)) {
        pos += initial.length;
      }
      return ansi.cursor.move(pos);
    }
  }
};

const erase = ansi.erase = {
  screen: code.screen,
  up: code.up,
  down: code.down,
  line: code.line,
  lineEnd: code.lineEnd,
  lineStart: code.lineStart,
  lines(n) {
    let str = '';
    for (let i = 0; i < n; i++) {
      str += ansi.erase.line + (i < n - 1 ? ansi.cursor.up(1) : '');
    }
    if (n) str += ansi.code.beginning;
    return str;
  }
};

ansi.clear = (input = '', columns = process.stdout.columns) => {
  if (!columns) return erase.line + cursor.to(0);
  let width = str => [...ansiColors.unstyle(str)].length;
  let lines = input.split(/\r?\n/);
  let rows = 0;
  for (let line of lines) {
    rows += 1 + Math.floor(Math.max(width(line) - 1, 0) / columns);
  }
  return (erase.line + cursor.prevLine()).repeat(rows - 1) + erase.line + cursor.to(0);
};
});

/**
 * Base class for creating a new Prompt.
 * @param {Object} `options` Question object.
 */

class Prompt extends events {
  constructor(options = {}) {
    super();
    this.name = options.name;
    this.type = options.type;
    this.options = options;
    theme(this);
    timer(this);
    this.state = new state(this);
    this.initial = [options.initial, options.default].find(v => v != null);
    this.stdout = options.stdout || process.stdout;
    this.stdin = options.stdin || process.stdin;
    this.scale = options.scale || 1;
    this.term = this.options.term || process.env.TERM_PROGRAM;
    this.margin = margin(this.options.margin);
    this.setMaxListeners(0);
    setOptions(this);
  }

  async keypress(input, event = {}) {
    this.keypressed = true;
    let key = keypress_1.action(input, keypress_1(input, event), this.options.actions);
    this.state.keypress = key;
    this.emit('keypress', input, key);
    this.emit('state', this.state.clone());
    let fn = this.options[key.action] || this[key.action] || this.dispatch;
    if (typeof fn === 'function') {
      return fn.call(this, input, key);
    }
    this.alert();
  }

  alert() {
    delete this.state.alert;
    if (this.options.show === false) {
      this.emit('alert');
    } else {
      this.stdout.write(ansi_1.code.beep);
    }
  }

  cursorHide() {
    this.stdout.write(ansi_1.cursor.hide());
    utils.onExit(() => this.cursorShow());
  }

  cursorShow() {
    this.stdout.write(ansi_1.cursor.show());
  }

  write(str) {
    if (!str) return;
    if (this.stdout && this.state.show !== false) {
      this.stdout.write(str);
    }
    this.state.buffer += str;
  }

  clear(lines = 0) {
    let buffer = this.state.buffer;
    this.state.buffer = '';
    if ((!buffer && !lines) || this.options.show === false) return;
    this.stdout.write(ansi_1.cursor.down(lines) + ansi_1.clear(buffer, this.width));
  }

  restore() {
    if (this.state.closed || this.options.show === false) return;

    let { prompt, after, rest } = this.sections();
    let { cursor, initial = '', input = '', value = '' } = this;

    let size = this.state.size = rest.length;
    let state = { after, cursor, initial, input, prompt, size, value };
    let codes = ansi_1.cursor.restore(state);
    if (codes) {
      this.stdout.write(codes);
    }
  }

  sections() {
    let { buffer, input, prompt } = this.state;
    prompt = ansiColors.unstyle(prompt);
    let buf = ansiColors.unstyle(buffer);
    let idx = buf.indexOf(prompt);
    let header = buf.slice(0, idx);
    let rest = buf.slice(idx);
    let lines = rest.split('\n');
    let first = lines[0];
    let last = lines[lines.length - 1];
    let promptLine = prompt + (input ? ' ' + input : '');
    let len = promptLine.length;
    let after = len < first.length ? first.slice(len + 1) : '';
    return { header, prompt: first, after, rest: lines.slice(1), last };
  }

  async submit() {
    this.state.submitted = true;
    this.state.validating = true;

    // this will only be called when the prompt is directly submitted
    // without initializing, i.e. when the prompt is skipped, etc. Otherwize,
    // "options.onSubmit" is will be handled by the "initialize()" method.
    if (this.options.onSubmit) {
      await this.options.onSubmit.call(this, this.name, this.value, this);
    }

    let result = this.state.error || await this.validate(this.value, this.state);
    if (result !== true) {
      let error = '\n' + this.symbols.pointer + ' ';

      if (typeof result === 'string') {
        error += result.trim();
      } else {
        error += 'Invalid input';
      }

      this.state.error = '\n' + this.styles.danger(error);
      this.state.submitted = false;
      await this.render();
      await this.alert();
      this.state.validating = false;
      this.state.error = void 0;
      return;
    }

    this.state.validating = false;
    await this.render();
    await this.close();

    this.value = await this.result(this.value);
    this.emit('submit', this.value);
  }

  async cancel(err) {
    this.state.cancelled = this.state.submitted = true;

    await this.render();
    await this.close();

    if (typeof this.options.onCancel === 'function') {
      await this.options.onCancel.call(this, this.name, this.value, this);
    }

    this.emit('cancel', await this.error(err));
  }

  async close() {
    this.state.closed = true;

    try {
      let sections = this.sections();
      let lines = Math.ceil(sections.prompt.length / this.width);
      if (sections.rest) {
        this.write(ansi_1.cursor.down(sections.rest.length));
      }
      this.write('\n'.repeat(lines));
    } catch (err) { /* do nothing */ }

    this.emit('close');
  }

  start() {
    if (!this.stop && this.options.show !== false) {
      this.stop = keypress_1.listen(this, this.keypress.bind(this));
      this.once('close', this.stop);
    }
  }

  async skip() {
    this.skipped = this.options.skip === true;
    if (typeof this.options.skip === 'function') {
      this.skipped = await this.options.skip.call(this, this.name, this.value);
    }
    return this.skipped;
  }

  async initialize() {
    let { format, options, result } = this;

    this.format = () => format.call(this, this.value);
    this.result = () => result.call(this, this.value);

    if (typeof options.initial === 'function') {
      this.initial = await options.initial.call(this, this);
    }

    if (typeof options.onRun === 'function') {
      await options.onRun.call(this, this);
    }

    // if "options.onSubmit" is defined, we wrap the "submit" method to guarantee
    // that "onSubmit" will always called first thing inside the submit
    // method, regardless of how it's handled in inheriting prompts.
    if (typeof options.onSubmit === 'function') {
      let onSubmit = options.onSubmit.bind(this);
      let submit = this.submit.bind(this);
      delete this.options.onSubmit;
      this.submit = async() => {
        await onSubmit(this.name, this.value, this);
        return submit();
      };
    }

    await this.start();
    await this.render();
  }

  render() {
    throw new Error('expected prompt to have a custom render method');
  }

  run() {
    return new Promise(async(resolve, reject) => {
      this.once('submit', resolve);
      this.once('cancel', reject);
      if (await this.skip()) {
        this.render = () => {};
        return this.submit();
      }
      await this.initialize();
      this.emit('run');
    });
  }

  async element(name, choice, i) {
    let { options, state, symbols, timers } = this;
    let timer = timers && timers[name];
    state.timer = timer;
    let value = options[name] || state[name] || symbols[name];
    let val = choice && choice[name] != null ? choice[name] : await value;
    if (val === '') return val;

    let res = await this.resolve(val, state, choice, i);
    if (!res && choice && choice[name]) {
      return this.resolve(value, state, choice, i);
    }
    return res;
  }

  async prefix() {
    let element = await this.element('prefix') || this.symbols;
    let timer = this.timers && this.timers.prefix;
    let state = this.state;
    state.timer = timer;
    if (utils.isObject(element)) element = element[state.status] || element.pending;
    if (!utils.hasColor(element)) {
      let style = this.styles[state.status] || this.styles.pending;
      return style(element);
    }
    return element;
  }

  async message() {
    let message = await this.element('message');
    if (!utils.hasColor(message)) {
      return this.styles.strong(message);
    }
    return message;
  }

  async separator() {
    let element = await this.element('separator') || this.symbols;
    let timer = this.timers && this.timers.separator;
    let state = this.state;
    state.timer = timer;
    let value = element[state.status] || element.pending || state.separator;
    let ele = await this.resolve(value, state);
    if (utils.isObject(ele)) ele = ele[state.status] || ele.pending;
    if (!utils.hasColor(ele)) {
      return this.styles.muted(ele);
    }
    return ele;
  }

  async pointer(choice, i) {
    let val = await this.element('pointer', choice, i);

    if (typeof val === 'string' && utils.hasColor(val)) {
      return val;
    }

    if (val) {
      let styles = this.styles;
      let focused = this.index === i;
      let style = focused ? styles.primary : val => val;
      let ele = await this.resolve(val[focused ? 'on' : 'off'] || val, this.state);
      let styled = !utils.hasColor(ele) ? style(ele) : ele;
      return focused ? styled : ' '.repeat(ele.length);
    }
  }

  async indicator(choice, i) {
    let val = await this.element('indicator', choice, i);
    if (typeof val === 'string' && utils.hasColor(val)) {
      return val;
    }
    if (val) {
      let styles = this.styles;
      let enabled = choice.enabled === true;
      let style = enabled ? styles.success : styles.dark;
      let ele = val[enabled ? 'on' : 'off'] || val;
      return !utils.hasColor(ele) ? style(ele) : ele;
    }
    return '';
  }

  body() {
    return null;
  }

  footer() {
    if (this.state.status === 'pending') {
      return this.element('footer');
    }
  }

  header() {
    if (this.state.status === 'pending') {
      return this.element('header');
    }
  }

  async hint() {
    if (this.state.status === 'pending' && !this.isValue(this.state.input)) {
      let hint = await this.element('hint');
      if (!utils.hasColor(hint)) {
        return this.styles.muted(hint);
      }
      return hint;
    }
  }

  error(err) {
    return !this.state.submitted ? (err || this.state.error) : '';
  }

  format(value) {
    return value;
  }

  result(value) {
    return value;
  }

  validate(value) {
    if (this.options.required === true) {
      return this.isValue(value);
    }
    return true;
  }

  isValue(value) {
    return value != null && value !== '';
  }

  resolve(value, ...args) {
    return utils.resolve(this, value, ...args);
  }

  get base() {
    return Prompt.prototype;
  }

  get style() {
    return this.styles[this.state.status];
  }

  get height() {
    return this.options.rows || utils.height(this.stdout, 25);
  }
  get width() {
    return this.options.columns || utils.width(this.stdout, 80);
  }
  get size() {
    return { width: this.width, height: this.height };
  }

  set cursor(value) {
    this.state.cursor = value;
  }
  get cursor() {
    return this.state.cursor;
  }

  set input(value) {
    this.state.input = value;
  }
  get input() {
    return this.state.input;
  }

  set value(value) {
    this.state.value = value;
  }
  get value() {
    let { input, value } = this.state;
    let result = [value, input].find(this.isValue.bind(this));
    return this.isValue(result) ? result : this.initial;
  }

  static get prompt() {
    return options => new this(options).run();
  }
}

function setOptions(prompt) {
  let isValidKey = key => {
    return prompt[key] === void 0 || typeof prompt[key] === 'function';
  };

  let ignore = [
    'actions',
    'choices',
    'initial',
    'margin',
    'roles',
    'styles',
    'symbols',
    'theme',
    'timers',
    'value'
  ];

  let ignoreFn = [
    'body',
    'footer',
    'error',
    'header',
    'hint',
    'indicator',
    'message',
    'prefix',
    'separator',
    'skip'
  ];

  for (let key of Object.keys(prompt.options)) {
    if (ignore.includes(key)) continue;
    if (/^on[A-Z]/.test(key)) continue;
    let option = prompt.options[key];
    if (typeof option === 'function' && isValidKey(key)) {
      if (!ignoreFn.includes(key)) {
        prompt[key] = option.bind(prompt);
      }
    } else if (typeof prompt[key] !== 'function') {
      prompt[key] = option;
    }
  }
}

function margin(value) {
  if (typeof value === 'number') {
    value = [value, value, value, value];
  }
  let arr = [].concat(value || []);
  let pad = i => i % 2 === 0 ? '\n' : ' ';
  let res = [];
  for (let i = 0; i < 4; i++) {
    let char = pad(i);
    if (arr[i]) {
      res.push(char.repeat(arr[i]));
    } else {
      res.push('');
    }
  }
  return res;
}

var prompt = Prompt;

const roles = {
  default(prompt, choice) {
    return choice;
  },
  checkbox(prompt, choice) {
    throw new Error('checkbox role is not implemented yet');
  },
  editable(prompt, choice) {
    throw new Error('editable role is not implemented yet');
  },
  expandable(prompt, choice) {
    throw new Error('expandable role is not implemented yet');
  },
  heading(prompt, choice) {
    choice.disabled = '';
    choice.indicator = [choice.indicator, ' '].find(v => v != null);
    choice.message = choice.message || '';
    return choice;
  },
  input(prompt, choice) {
    throw new Error('input role is not implemented yet');
  },
  option(prompt, choice) {
    return roles.default(prompt, choice);
  },
  radio(prompt, choice) {
    throw new Error('radio role is not implemented yet');
  },
  separator(prompt, choice) {
    choice.disabled = '';
    choice.indicator = [choice.indicator, ' '].find(v => v != null);
    choice.message = choice.message || prompt.symbols.line.repeat(5);
    return choice;
  },
  spacer(prompt, choice) {
    return choice;
  }
};

var roles_1 = (name, options = {}) => {
  let role = utils.merge({}, roles, options.roles);
  return role[name] || role.default;
};

const { reorder, scrollUp, scrollDown, isObject, swap } = utils;

class ArrayPrompt extends prompt {
  constructor(options) {
    super(options);
    this.cursorHide();
    this.maxSelected = options.maxSelected || Infinity;
    this.multiple = options.multiple || false;
    this.initial = options.initial || 0;
    this.delay = options.delay || 0;
    this.longest = 0;
    this.num = '';
  }

  async initialize() {
    if (typeof this.options.initial === 'function') {
      this.initial = await this.options.initial.call(this);
    }
    await this.reset(true);
    await super.initialize();
  }

  async reset() {
    let { choices, initial, autofocus, suggest } = this.options;
    this.state._choices = [];
    this.state.choices = [];

    this.choices = await Promise.all(await this.toChoices(choices));
    this.choices.forEach(ch => (ch.enabled = false));

    if (typeof suggest !== 'function' && this.selectable.length === 0) {
      throw new Error('At least one choice must be selectable');
    }

    if (isObject(initial)) initial = Object.keys(initial);
    if (Array.isArray(initial)) {
      if (autofocus != null) this.index = this.findIndex(autofocus);
      initial.forEach(v => this.enable(this.find(v)));
      await this.render();
    } else {
      if (autofocus != null) initial = autofocus;
      if (typeof initial === 'string') initial = this.findIndex(initial);
      if (typeof initial === 'number' && initial > -1) {
        this.index = Math.max(0, Math.min(initial, this.choices.length));
        this.enable(this.find(this.index));
      }
    }

    if (this.isDisabled(this.focused)) {
      await this.down();
    }
  }

  async toChoices(value, parent) {
    this.state.loadingChoices = true;
    let choices = [];
    let index = 0;

    let toChoices = async(items, parent) => {
      if (typeof items === 'function') items = await items.call(this);
      if (items instanceof Promise) items = await items;

      for (let i = 0; i < items.length; i++) {
        let choice = items[i] = await this.toChoice(items[i], index++, parent);
        choices.push(choice);

        if (choice.choices) {
          await toChoices(choice.choices, choice);
        }
      }
      return choices;
    };

    return toChoices(value, parent)
      .then(choices => {
        this.state.loadingChoices = false;
        return choices;
      });
  }

  async toChoice(ele, i, parent) {
    if (typeof ele === 'function') ele = await ele.call(this, this);
    if (ele instanceof Promise) ele = await ele;
    if (typeof ele === 'string') ele = { name: ele };

    if (ele.normalized) return ele;
    ele.normalized = true;

    let origVal = ele.value;
    let role = roles_1(ele.role, this.options);
    ele = role(this, ele);

    if (typeof ele.disabled === 'string' && !ele.hint) {
      ele.hint = ele.disabled;
      ele.disabled = true;
    }

    if (ele.disabled === true && ele.hint == null) {
      ele.hint = '(disabled)';
    }

    // if the choice was already normalized, return it
    if (ele.index != null) return ele;
    ele.name = ele.name || ele.key || ele.title || ele.value || ele.message;
    ele.message = ele.message || ele.name || '';
    ele.value = [ele.value, ele.name].find(this.isValue.bind(this));

    ele.input = '';
    ele.index = i;
    ele.cursor = 0;

    utils.define(ele, 'parent', parent);
    ele.level = parent ? parent.level + 1 : 1;
    if (ele.indent == null) {
      ele.indent = parent ? parent.indent + '  ' : (ele.indent || '');
    }

    ele.path = parent ? parent.path + '.' + ele.name : ele.name;
    ele.enabled = !!(this.multiple && !this.isDisabled(ele) && (ele.enabled || this.isSelected(ele)));

    if (!this.isDisabled(ele)) {
      this.longest = Math.max(this.longest, ansiColors.unstyle(ele.message).length);
    }

    // shallow clone the choice first
    let choice = { ...ele };

    // then allow the choice to be reset using the "original" values
    ele.reset = (input = choice.input, value = choice.value) => {
      for (let key of Object.keys(choice)) ele[key] = choice[key];
      ele.input = input;
      ele.value = value;
    };

    if (origVal == null && typeof ele.initial === 'function') {
      ele.input = await ele.initial.call(this, this.state, ele, i);
    }

    return ele;
  }

  async onChoice(choice, i) {
    this.emit('choice', choice, i, this);

    if (typeof choice.onChoice === 'function') {
      await choice.onChoice.call(this, this.state, choice, i);
    }
  }

  async addChoice(ele, i, parent) {
    let choice = await this.toChoice(ele, i, parent);
    this.choices.push(choice);
    this.index = this.choices.length - 1;
    this.limit = this.choices.length;
    return choice;
  }

  async newItem(item, i, parent) {
    let ele = { name: 'New choice name?', editable: true, newChoice: true, ...item };
    let choice = await this.addChoice(ele, i, parent);

    choice.updateChoice = () => {
      delete choice.newChoice;
      choice.name = choice.message = choice.input;
      choice.input = '';
      choice.cursor = 0;
    };

    return this.render();
  }

  indent(choice) {
    if (choice.indent == null) {
      return choice.level > 1 ? '  '.repeat(choice.level - 1) : '';
    }
    return choice.indent;
  }

  dispatch(s, key) {
    if (this.multiple && this[key.name]) return this[key.name]();
    this.alert();
  }

  focus(choice, enabled) {
    if (typeof enabled !== 'boolean') enabled = choice.enabled;
    if (enabled && !choice.enabled && this.selected.length >= this.maxSelected) {
      return this.alert();
    }
    this.index = choice.index;
    choice.enabled = enabled && !this.isDisabled(choice);
    return choice;
  }

  space() {
    if (!this.multiple) return this.alert();
    this.toggle(this.focused);
    return this.render();
  }

  a() {
    if (this.maxSelected < this.choices.length) return this.alert();
    let enabled = this.selectable.every(ch => ch.enabled);
    this.choices.forEach(ch => (ch.enabled = !enabled));
    return this.render();
  }

  i() {
    // don't allow choices to be inverted if it will result in
    // more than the maximum number of allowed selected items.
    if (this.choices.length - this.selected.length > this.maxSelected) {
      return this.alert();
    }
    this.choices.forEach(ch => (ch.enabled = !ch.enabled));
    return this.render();
  }

  g(choice = this.focused) {
    if (!this.choices.some(ch => !!ch.parent)) return this.a();
    this.toggle((choice.parent && !choice.choices) ? choice.parent : choice);
    return this.render();
  }

  toggle(choice, enabled) {
    if (!choice.enabled && this.selected.length >= this.maxSelected) {
      return this.alert();
    }

    if (typeof enabled !== 'boolean') enabled = !choice.enabled;
    choice.enabled = enabled;

    if (choice.choices) {
      choice.choices.forEach(ch => this.toggle(ch, enabled));
    }

    let parent = choice.parent;
    while (parent) {
      let choices = parent.choices.filter(ch => this.isDisabled(ch));
      parent.enabled = choices.every(ch => ch.enabled === true);
      parent = parent.parent;
    }

    reset(this, this.choices);
    this.emit('toggle', choice, this);
    return choice;
  }

  enable(choice) {
    if (this.selected.length >= this.maxSelected) return this.alert();
    choice.enabled = !this.isDisabled(choice);
    choice.choices && choice.choices.forEach(this.enable.bind(this));
    return choice;
  }

  disable(choice) {
    choice.enabled = false;
    choice.choices && choice.choices.forEach(this.disable.bind(this));
    return choice;
  }

  number(n) {
    this.num += n;

    let number = num => {
      let i = Number(num);
      if (i > this.choices.length - 1) return this.alert();

      let focused = this.focused;
      let choice = this.choices.find(ch => i === ch.index);

      if (!choice.enabled && this.selected.length >= this.maxSelected) {
        return this.alert();
      }

      if (this.visible.indexOf(choice) === -1) {
        let choices = reorder(this.choices);
        let actualIdx = choices.indexOf(choice);

        if (focused.index > actualIdx) {
          let start = choices.slice(actualIdx, actualIdx + this.limit);
          let end = choices.filter(ch => !start.includes(ch));
          this.choices = start.concat(end);
        } else {
          let pos = actualIdx - this.limit + 1;
          this.choices = choices.slice(pos).concat(choices.slice(0, pos));
        }
      }

      this.index = this.choices.indexOf(choice);
      this.toggle(this.focused);
      return this.render();
    };

    clearTimeout(this.numberTimeout);

    return new Promise(resolve => {
      let len = this.choices.length;
      let num = this.num;

      let handle = (val = false, res) => {
        clearTimeout(this.numberTimeout);
        if (val) number(num);
        this.num = '';
        resolve(res);
      };

      if (num === '0' || (num.length === 1 && Number(num + '0') > len)) {
        return handle(true);
      }

      if (Number(num) > len) {
        return handle(false, this.alert());
      }

      this.numberTimeout = setTimeout(() => handle(true), this.delay);
    });
  }

  home() {
    this.choices = reorder(this.choices);
    this.index = 0;
    return this.render();
  }

  end() {
    let pos = this.choices.length - this.limit;
    let choices = reorder(this.choices);
    this.choices = choices.slice(pos).concat(choices.slice(0, pos));
    this.index = this.limit - 1;
    return this.render();
  }

  first() {
    this.index = 0;
    return this.render();
  }

  last() {
    this.index = this.visible.length - 1;
    return this.render();
  }

  prev() {
    if (this.visible.length <= 1) return this.alert();
    return this.up();
  }

  next() {
    if (this.visible.length <= 1) return this.alert();
    return this.down();
  }

  right() {
    if (this.cursor >= this.input.length) return this.alert();
    this.cursor++;
    return this.render();
  }

  left() {
    if (this.cursor <= 0) return this.alert();
    this.cursor--;
    return this.render();
  }

  up() {
    let len = this.choices.length;
    let vis = this.visible.length;
    let idx = this.index;
    if (this.options.scroll === false && idx === 0) {
      return this.alert();
    }
    if (len > vis && idx === 0) {
      return this.scrollUp();
    }
    this.index = ((idx - 1 % len) + len) % len;
    if (this.isDisabled()) {
      return this.up();
    }
    return this.render();
  }

  down() {
    let len = this.choices.length;
    let vis = this.visible.length;
    let idx = this.index;
    if (this.options.scroll === false && idx === vis - 1) {
      return this.alert();
    }
    if (len > vis && idx === vis - 1) {
      return this.scrollDown();
    }
    this.index = (idx + 1) % len;
    if (this.isDisabled()) {
      return this.down();
    }
    return this.render();
  }

  scrollUp(i = 0) {
    this.choices = scrollUp(this.choices);
    this.index = i;
    if (this.isDisabled()) {
      return this.up();
    }
    return this.render();
  }

  scrollDown(i = this.visible.length - 1) {
    this.choices = scrollDown(this.choices);
    this.index = i;
    if (this.isDisabled()) {
      return this.down();
    }
    return this.render();
  }

  async shiftUp() {
    if (this.options.sort === true) {
      this.sorting = true;
      this.swap(this.index - 1);
      await this.up();
      this.sorting = false;
      return;
    }
    return this.scrollUp(this.index);
  }

  async shiftDown() {
    if (this.options.sort === true) {
      this.sorting = true;
      this.swap(this.index + 1);
      await this.down();
      this.sorting = false;
      return;
    }
    return this.scrollDown(this.index);
  }

  pageUp() {
    if (this.visible.length <= 1) return this.alert();
    this.limit = Math.max(this.limit - 1, 0);
    this.index = Math.min(this.limit - 1, this.index);
    this._limit = this.limit;
    if (this.isDisabled()) {
      return this.up();
    }
    return this.render();
  }

  pageDown() {
    if (this.visible.length >= this.choices.length) return this.alert();
    this.index = Math.max(0, this.index);
    this.limit = Math.min(this.limit + 1, this.choices.length);
    this._limit = this.limit;
    if (this.isDisabled()) {
      return this.down();
    }
    return this.render();
  }

  swap(pos) {
    swap(this.choices, this.index, pos);
  }

  isDisabled(choice = this.focused) {
    let keys = ['disabled', 'collapsed', 'hidden', 'completing', 'readonly'];
    if (choice && keys.some(key => choice[key] === true)) {
      return true;
    }
    return choice && choice.role === 'heading';
  }

  isEnabled(choice = this.focused) {
    if (Array.isArray(choice)) return choice.every(ch => this.isEnabled(ch));
    if (choice.choices) {
      let choices = choice.choices.filter(ch => !this.isDisabled(ch));
      return choice.enabled && choices.every(ch => this.isEnabled(ch));
    }
    return choice.enabled && !this.isDisabled(choice);
  }

  isChoice(choice, value) {
    return choice.name === value || choice.index === Number(value);
  }

  isSelected(choice) {
    if (Array.isArray(this.initial)) {
      return this.initial.some(value => this.isChoice(choice, value));
    }
    return this.isChoice(choice, this.initial);
  }

  map(names = [], prop = 'value') {
    return [].concat(names || []).reduce((acc, name) => {
      acc[name] = this.find(name, prop);
      return acc;
    }, {});
  }

  filter(value, prop) {
    let isChoice = (ele, i) => [ele.name, i].includes(value);
    let fn = typeof value === 'function' ? value : isChoice;
    let choices = this.options.multiple ? this.state._choices : this.choices;
    let result = choices.filter(fn);
    if (prop) {
      return result.map(ch => ch[prop]);
    }
    return result;
  }

  find(value, prop) {
    if (isObject(value)) return prop ? value[prop] : value;
    let isChoice = (ele, i) => [ele.name, i].includes(value);
    let fn = typeof value === 'function' ? value : isChoice;
    let choice = this.choices.find(fn);
    if (choice) {
      return prop ? choice[prop] : choice;
    }
  }

  findIndex(value) {
    return this.choices.indexOf(this.find(value));
  }

  async submit() {
    let choice = this.focused;
    if (!choice) return this.alert();

    if (choice.newChoice) {
      if (!choice.input) return this.alert();
      choice.updateChoice();
      return this.render();
    }

    if (this.choices.some(ch => ch.newChoice)) {
      return this.alert();
    }

    let { reorder, sort } = this.options;
    let multi = this.multiple === true;
    let value = this.selected;
    if (value === void 0) {
      return this.alert();
    }

    // re-sort choices to original order
    if (Array.isArray(value) && reorder !== false && sort !== true) {
      value = utils.reorder(value);
    }

    this.value = multi ? value.map(ch => ch.name) : value.name;
    return super.submit();
  }

  set choices(choices = []) {
    this.state._choices = this.state._choices || [];
    this.state.choices = choices;

    for (let choice of choices) {
      if (!this.state._choices.some(ch => ch.name === choice.name)) {
        this.state._choices.push(choice);
      }
    }

    if (!this._initial && this.options.initial) {
      this._initial = true;
      let init = this.initial;
      if (typeof init === 'string' || typeof init === 'number') {
        let choice = this.find(init);
        if (choice) {
          this.initial = choice.index;
          this.focus(choice, true);
        }
      }
    }
  }
  get choices() {
    return reset(this, this.state.choices || []);
  }

  set visible(visible) {
    this.state.visible = visible;
  }
  get visible() {
    return (this.state.visible || this.choices).slice(0, this.limit);
  }

  set limit(num) {
    this.state.limit = num;
  }
  get limit() {
    let { state, options, choices } = this;
    let limit = state.limit || this._limit || options.limit || choices.length;
    return Math.min(limit, this.height);
  }

  set value(value) {
    super.value = value;
  }
  get value() {
    if (typeof super.value !== 'string' && super.value === this.initial) {
      return this.input;
    }
    return super.value;
  }

  set index(i) {
    this.state.index = i;
  }
  get index() {
    return Math.max(0, this.state ? this.state.index : 0);
  }

  get enabled() {
    return this.filter(this.isEnabled.bind(this));
  }

  get focused() {
    let choice = this.choices[this.index];
    if (choice && this.state.submitted && this.multiple !== true) {
      choice.enabled = true;
    }
    return choice;
  }

  get selectable() {
    return this.choices.filter(choice => !this.isDisabled(choice));
  }

  get selected() {
    return this.multiple ? this.enabled : this.focused;
  }
}

function reset(prompt, choices) {
  if (choices instanceof Promise) return choices;
  if (typeof choices === 'function') {
    if (utils.isAsyncFn(choices)) return choices;
    choices = choices.call(prompt, prompt);
  }
  for (let choice of choices) {
    if (Array.isArray(choice.choices)) {
      let items = choice.choices.filter(ch => !prompt.isDisabled(ch));
      choice.enabled = items.every(ch => ch.enabled === true);
    }
    if (prompt.isDisabled(choice) === true) {
      delete choice.enabled;
    }
  }
  return choices;
}

var array = ArrayPrompt;

class SelectPrompt extends array {
  constructor(options) {
    super(options);
    this.emptyError = this.options.emptyError || 'No items were selected';
  }

  async dispatch(s, key) {
    if (this.multiple) {
      return this[key.name] ? await this[key.name](s, key) : await super.dispatch(s, key);
    }
    this.alert();
  }

  separator() {
    if (this.options.separator) return super.separator();
    let sep = this.styles.muted(this.symbols.ellipsis);
    return this.state.submitted ? super.separator() : sep;
  }

  pointer(choice, i) {
    return (!this.multiple || this.options.pointer) ? super.pointer(choice, i) : '';
  }

  indicator(choice, i) {
    return this.multiple ? super.indicator(choice, i) : '';
  }

  choiceMessage(choice, i) {
    let message = this.resolve(choice.message, this.state, choice, i);
    if (choice.role === 'heading' && !utils.hasColor(message)) {
      message = this.styles.strong(message);
    }
    return this.resolve(message, this.state, choice, i);
  }

  choiceSeparator() {
    return ':';
  }

  async renderChoice(choice, i) {
    await this.onChoice(choice, i);

    let focused = this.index === i;
    let pointer = await this.pointer(choice, i);
    let check = await this.indicator(choice, i) + (choice.pad || '');
    let hint = await this.resolve(choice.hint, this.state, choice, i);

    if (hint && !utils.hasColor(hint)) {
      hint = this.styles.muted(hint);
    }

    let ind = this.indent(choice);
    let msg = await this.choiceMessage(choice, i);
    let line = () => [this.margin[3], ind + pointer + check, msg, this.margin[1], hint].filter(Boolean).join(' ');

    if (choice.role === 'heading') {
      return line();
    }

    if (choice.disabled) {
      if (!utils.hasColor(msg)) {
        msg = this.styles.disabled(msg);
      }
      return line();
    }

    if (focused) {
      msg = this.styles.em(msg);
    }

    return line();
  }

  async renderChoices() {
    if (this.state.loading === 'choices') {
      return this.styles.warning('Loading choices');
    }

    if (this.state.submitted) return '';
    let choices = this.visible.map(async(ch, i) => await this.renderChoice(ch, i));
    let visible = await Promise.all(choices);
    if (!visible.length) visible.push(this.styles.danger('No matching choices'));
    let result = this.margin[0] + visible.join('\n');
    let header;

    if (this.options.choicesHeader) {
      header = await this.resolve(this.options.choicesHeader, this.state);
    }

    return [header, result].filter(Boolean).join('\n');
  }

  format() {
    if (!this.state.submitted) return '';
    if (Array.isArray(this.selected)) {
      return this.selected.map(choice => this.styles.primary(choice.name)).join(', ');
    }
    return this.styles.primary(this.selected.name);
  }

  async render() {
    let { submitted, size } = this.state;

    let prompt = '';
    let header = await this.header();
    let prefix = await this.prefix();
    let separator = await this.separator();
    let message = await this.message();

    if (this.options.promptLine !== false) {
      prompt = [prefix, message, separator, ''].join(' ');
      this.state.prompt = prompt;
    }

    let output = await this.format();
    let help = (await this.error()) || (await this.hint());
    let body = await this.renderChoices();
    let footer = await this.footer();

    if (output) prompt += output;
    if (help && !prompt.includes(help)) prompt += ' ' + help;

    if (submitted && !output && !body.trim() && this.multiple && this.emptyError != null) {
      prompt += this.styles.danger(this.emptyError);
    }

    this.clear(size);
    this.write([header, prompt, body, footer].filter(Boolean).join('\n'));
    this.write(this.margin[2]);
    this.restore();
  }
}

var select = SelectPrompt;

const highlight = (input, color) => {
  let val = input.toLowerCase();
  return str => {
    let s = str.toLowerCase();
    let i = s.indexOf(val);
    let colored = color(str.slice(i, i + val.length));
    return str.slice(0, i) + colored + str.slice(i + val.length);
  };
};

class AutoComplete extends select {
  constructor(options) {
    super(options);
    this.cursorShow();
  }

  moveCursor(n) {
    this.state.cursor += n;
  }

  dispatch(ch) {
    return this.append(ch);
  }

  space(ch) {
    return this.options.multiple ? super.space(ch) : this.append(ch);
  }

  append(ch) {
    let { cursor, input } = this.state;
    this.input = input.slice(0, cursor) + ch + input.slice(cursor);
    this.moveCursor(1);
    return this.complete();
  }

  delete() {
    let { cursor, input } = this.state;
    if (!input) return this.alert();
    this.input = input.slice(0, cursor - 1) + input.slice(cursor);
    this.moveCursor(-1);
    return this.complete();
  }

  deleteForward() {
    let { cursor, input } = this.state;
    if (input[cursor] === void 0) return this.alert();
    this.input = `${input}`.slice(0, cursor) + `${input}`.slice(cursor + 1);
    return this.complete();
  }

  async complete() {
    this.completing = true;
    this.choices = await this.suggest(this.input, this.state._choices);
    this.state.limit = void 0; // allow getter/setter to reset limit
    this.index = Math.min(Math.max(this.visible.length - 1, 0), this.index);
    await this.render();
    this.completing = false;
  }

  suggest(input = this.input, choices = this.state._choices) {
    if (typeof this.options.suggest === 'function') {
      return this.options.suggest.call(this, input, choices);
    }
    let str = input.toLowerCase();
    return choices.filter(ch => ch.message.toLowerCase().includes(str));
  }

  pointer() {
    return '';
  }

  format() {
    if (!this.focused) return this.input;
    if (this.options.multiple && this.state.submitted) {
      return this.selected.map(ch => this.styles.primary(ch.message)).join(', ');
    }
    if (this.state.submitted) {
      let value = this.value = this.input = this.focused.value;
      return this.styles.primary(value);
    }
    return this.input;
  }

  async render() {
    if (this.state.status !== 'pending') return super.render();
    let style = this.options.highlight
      ? this.options.highlight.bind(this)
      : this.styles.placeholder;

    let color = highlight(this.input, style);
    let choices = this.choices;
    this.choices = choices.map(ch => ({ ...ch, message: color(ch.message) }));
    await super.render();
    this.choices = choices;
  }

  submit() {
    if (this.options.multiple) {
      this.value = this.selected.map(ch => ch.name);
    }
    return super.submit();
  }
}

var autocomplete = AutoComplete;

/**
 * Render a placeholder value with cursor and styling based on the
 * position of the cursor.
 *
 * @param {Object} `prompt` Prompt instance.
 * @param {String} `input` Input string.
 * @param {String} `initial` The initial user-provided value.
 * @param {Number} `pos` Current cursor position.
 * @param {Boolean} `showCursor` Render a simulated cursor using the inverse primary style.
 * @return {String} Returns the styled placeholder string.
 * @api public
 */

var placeholder = (prompt, options = {}) => {
  prompt.cursorHide();

  let { input = '', initial = '', pos, showCursor = true, color } = options;
  let style = color || prompt.styles.placeholder;
  let inverse = utils.inverse(prompt.styles.primary);
  let blinker = str => inverse(prompt.styles.black(str));
  let output = input;
  let char = ' ';
  let reverse = blinker(char);

  if (prompt.blink && prompt.blink.off === true) {
    blinker = str => str;
    reverse = '';
  }

  if (showCursor && pos === 0 && initial === '' && input === '') {
    return blinker(char);
  }

  if (showCursor && pos === 0 && (input === initial || input === '')) {
    return blinker(initial[0]) + style(initial.slice(1));
  }

  initial = utils.isPrimitive(initial) ? `${initial}` : '';
  input = utils.isPrimitive(input) ? `${input}` : '';

  let placeholder = initial && initial.startsWith(input) && initial !== input;
  let cursor = placeholder ? blinker(initial[input.length]) : reverse;

  if (pos !== input.length && showCursor === true) {
    output = input.slice(0, pos) + blinker(input[pos]) + input.slice(pos + 1);
    cursor = '';
  }

  if (showCursor === false) {
    cursor = '';
  }

  if (placeholder) {
    let raw = prompt.styles.unstyle(output + cursor);
    return output + cursor + style(initial.slice(raw.length));
  }

  return output + cursor;
};

class FormPrompt extends select {
  constructor(options) {
    super({ ...options, multiple: true });
    this.type = 'form';
    this.initial = this.options.initial;
    this.align = [this.options.align, 'right'].find(v => v != null);
    this.emptyError = '';
    this.values = {};
  }

  async reset(first) {
    await super.reset();
    if (first === true) this._index = this.index;
    this.index = this._index;
    this.values = {};
    this.choices.forEach(choice => choice.reset && choice.reset());
    return this.render();
  }

  dispatch(char) {
    return !!char && this.append(char);
  }

  append(char) {
    let choice = this.focused;
    if (!choice) return this.alert();
    let { cursor, input } = choice;
    choice.value = choice.input = input.slice(0, cursor) + char + input.slice(cursor);
    choice.cursor++;
    return this.render();
  }

  delete() {
    let choice = this.focused;
    if (!choice || choice.cursor <= 0) return this.alert();
    let { cursor, input } = choice;
    choice.value = choice.input = input.slice(0, cursor - 1) + input.slice(cursor);
    choice.cursor--;
    return this.render();
  }

  deleteForward() {
    let choice = this.focused;
    if (!choice) return this.alert();
    let { cursor, input } = choice;
    if (input[cursor] === void 0) return this.alert();
    let str = `${input}`.slice(0, cursor) + `${input}`.slice(cursor + 1);
    choice.value = choice.input = str;
    return this.render();
  }

  right() {
    let choice = this.focused;
    if (!choice) return this.alert();
    if (choice.cursor >= choice.input.length) return this.alert();
    choice.cursor++;
    return this.render();
  }

  left() {
    let choice = this.focused;
    if (!choice) return this.alert();
    if (choice.cursor <= 0) return this.alert();
    choice.cursor--;
    return this.render();
  }

  space(ch, key) {
    return this.dispatch(ch, key);
  }

  number(ch, key) {
    return this.dispatch(ch, key);
  }

  next() {
    let ch = this.focused;
    if (!ch) return this.alert();
    let { initial, input } = ch;
    if (initial && initial.startsWith(input) && input !== initial) {
      ch.value = ch.input = initial;
      ch.cursor = ch.value.length;
      return this.render();
    }
    return super.next();
  }

  prev() {
    let ch = this.focused;
    if (!ch) return this.alert();
    if (ch.cursor === 0) return super.prev();
    ch.value = ch.input = '';
    ch.cursor = 0;
    return this.render();
  }

  separator() {
    return '';
  }

  format(value) {
    return !this.state.submitted ? super.format(value) : '';
  }

  pointer() {
    return '';
  }

  indicator(choice) {
    return choice.input ? '⦿' : '⊙';
  }

  async choiceSeparator(choice, i) {
    let sep = await this.resolve(choice.separator, this.state, choice, i) || ':';
    return sep ? ' ' + this.styles.disabled(sep) : '';
  }

  async renderChoice(choice, i) {
    await this.onChoice(choice, i);

    let { state, styles } = this;
    let { cursor, initial = '', name, hint, input = '' } = choice;
    let { muted, submitted, primary, danger } = styles;

    let help = hint;
    let focused = this.index === i;
    let validate = choice.validate || (() => true);
    let sep = await this.choiceSeparator(choice, i);
    let msg = choice.message;

    if (this.align === 'right') msg = msg.padStart(this.longest + 1, ' ');
    if (this.align === 'left') msg = msg.padEnd(this.longest + 1, ' ');

    // re-populate the form values (answers) object
    let value = this.values[name] = (input || initial);
    let color = input ? 'success' : 'dark';

    if ((await validate.call(choice, value, this.state)) !== true) {
      color = 'danger';
    }

    let style = styles[color];
    let indicator = style(await this.indicator(choice, i)) + (choice.pad || '');

    let indent = this.indent(choice);
    let line = () => [indent, indicator, msg + sep, input, help].filter(Boolean).join(' ');

    if (state.submitted) {
      msg = ansiColors.unstyle(msg);
      input = submitted(input);
      help = '';
      return line();
    }

    if (choice.format) {
      input = await choice.format.call(this, input, choice, i);
    } else {
      let color = this.styles.muted;
      let options = { input, initial, pos: cursor, showCursor: focused, color };
      input = placeholder(this, options);
    }

    if (!this.isValue(input)) {
      input = this.styles.muted(this.symbols.ellipsis);
    }

    if (choice.result) {
      this.values[name] = await choice.result.call(this, value, choice, i);
    }

    if (focused) {
      msg = primary(msg);
    }

    if (choice.error) {
      input += (input ? ' ' : '') + danger(choice.error.trim());
    } else if (choice.hint) {
      input += (input ? ' ' : '') + muted(choice.hint.trim());
    }

    return line();
  }

  async submit() {
    this.value = this.values;
    return super.base.submit.call(this);
  }
}

var form = FormPrompt;

const defaultAuthenticate = () => {
  throw new Error('expected prompt to have a custom authenticate method');
};

const factory = (authenticate = defaultAuthenticate) => {

  class AuthPrompt extends form {
    constructor(options) {
      super(options);
    }

    async submit() {
      this.value = await authenticate.call(this, this.values, this.state);
      super.base.submit.call(this);
    }

    static create(authenticate) {
      return factory(authenticate);
    }
  }

  return AuthPrompt;
};

var auth = factory();

function defaultAuthenticate$1(value, state) {
  if (value.username === this.options.username && value.password === this.options.password) {
    return true;
  }
  return false;
}

const factory$1 = (authenticate = defaultAuthenticate$1) => {
  const choices = [
    { name: 'username', message: 'username' },
    {
      name: 'password',
      message: 'password',
      format(input) {
        if (this.options.showPassword) {
          return input;
        }
        let color = this.state.submitted ? this.styles.primary : this.styles.muted;
        return color(this.symbols.asterisk.repeat(input.length));
      }
    }
  ];

  class BasicAuthPrompt extends auth.create(authenticate) {
    constructor(options) {
      super({ ...options, choices });
    }

    static create(authenticate) {
      return factory$1(authenticate);
    }
  }

  return BasicAuthPrompt;
};

var basicauth = factory$1();

const { isPrimitive, hasColor } = utils;

class BooleanPrompt extends prompt {
  constructor(options) {
    super(options);
    this.cursorHide();
  }

  async initialize() {
    let initial = await this.resolve(this.initial, this.state);
    this.input = await this.cast(initial);
    await super.initialize();
  }

  dispatch(ch) {
    if (!this.isValue(ch)) return this.alert();
    this.input = ch;
    return this.submit();
  }

  format(value) {
    let { styles, state } = this;
    return !state.submitted ? styles.primary(value) : styles.success(value);
  }

  cast(input) {
    return this.isTrue(input);
  }

  isTrue(input) {
    return /^[ty1]/i.test(input);
  }

  isFalse(input) {
    return /^[fn0]/i.test(input);
  }

  isValue(value) {
    return isPrimitive(value) && (this.isTrue(value) || this.isFalse(value));
  }

  async hint() {
    if (this.state.status === 'pending') {
      let hint = await this.element('hint');
      if (!hasColor(hint)) {
        return this.styles.muted(hint);
      }
      return hint;
    }
  }

  async render() {
    let { input, size } = this.state;

    let prefix = await this.prefix();
    let sep = await this.separator();
    let msg = await this.message();
    let hint = this.styles.muted(this.default);

    let promptLine = [prefix, msg, hint, sep].filter(Boolean).join(' ');
    this.state.prompt = promptLine;

    let header = await this.header();
    let value = this.value = this.cast(input);
    let output = await this.format(value);
    let help = (await this.error()) || (await this.hint());
    let footer = await this.footer();

    if (help && !promptLine.includes(help)) output += ' ' + help;
    promptLine += ' ' + output;

    this.clear(size);
    this.write([header, promptLine, footer].filter(Boolean).join('\n'));
    this.restore();
  }

  set value(value) {
    super.value = value;
  }
  get value() {
    return this.cast(super.value);
  }
}

var boolean_1 = BooleanPrompt;

class ConfirmPrompt extends boolean_1 {
  constructor(options) {
    super(options);
    this.default = this.options.default || (this.initial ? '(Y/n)' : '(y/N)');
  }
}

var confirm = ConfirmPrompt;

const form$1 = form.prototype;

class Editable extends select {
  constructor(options) {
    super({ ...options, multiple: true });
    this.align = [this.options.align, 'left'].find(v => v != null);
    this.emptyError = '';
    this.values = {};
  }

  dispatch(char, key) {
    let choice = this.focused;
    let parent = choice.parent || {};
    if (!choice.editable && !parent.editable) {
      if (char === 'a' || char === 'i') return super[char]();
    }
    return form$1.dispatch.call(this, char, key);
  }

  append(char, key) {
    return form$1.append.call(this, char, key);
  }

  delete(char, key) {
    return form$1.delete.call(this, char, key);
  }

  space(char) {
    return this.focused.editable ? this.append(char) : super.space();
  }

  number(char) {
    return this.focused.editable ? this.append(char) : super.number(char);
  }

  next() {
    return this.focused.editable ? form$1.next.call(this) : super.next();
  }

  prev() {
    return this.focused.editable ? form$1.prev.call(this) : super.prev();
  }

  async indicator(choice, i) {
    let symbol = choice.indicator || '';
    let value = choice.editable ? symbol : super.indicator(choice, i);
    return await this.resolve(value, this.state, choice, i) || '';
  }

  indent(choice) {
    return choice.role === 'heading' ? '' : (choice.editable ? ' ' : '  ');
  }

  async renderChoice(choice, i) {
    choice.indent = '';
    if (choice.editable) return form$1.renderChoice.call(this, choice, i);
    return super.renderChoice(choice, i);
  }

  error() {
    return '';
  }

  footer() {
    return this.state.error;
  }

  async validate() {
    let result = true;

    for (let choice of this.choices) {
      if (typeof choice.validate !== 'function') {
        continue;
      }

      if (choice.role === 'heading') {
        continue;
      }

      let val = choice.parent ? this.value[choice.parent.name] : this.value;

      if (choice.editable) {
        val = choice.value === choice.name ? choice.initial || '' : choice.value;
      } else if (!this.isDisabled(choice)) {
        val = choice.enabled === true;
      }

      result = await choice.validate(val, this.state);

      if (result !== true) {
        break;
      }
    }

    if (result !== true) {
      this.state.error = typeof result === 'string' ? result : 'Invalid Input';
    }

    return result;
  }

  submit() {
    if (this.focused.newChoice === true) return super.submit();
    if (this.choices.some(ch => ch.newChoice)) {
      return this.alert();
    }

    this.value = {};

    for (let choice of this.choices) {
      let val = choice.parent ? this.value[choice.parent.name] : this.value;

      if (choice.role === 'heading') {
        this.value[choice.name] = {};
        continue;
      }

      if (choice.editable) {
        val[choice.name] = choice.value === choice.name
          ? (choice.initial || '')
          : choice.value;

      } else if (!this.isDisabled(choice)) {
        val[choice.name] = choice.enabled === true;
      }
    }

    return this.base.submit.call(this);
  }
}

var editable = Editable;

const { isPrimitive: isPrimitive$1 } = utils;

class StringPrompt extends prompt {
  constructor(options) {
    super(options);
    this.initial = isPrimitive$1(this.initial) ? String(this.initial) : '';
    if (this.initial) this.cursorHide();
    this.state.prevCursor = 0;
    this.state.clipboard = [];
  }

  async keypress(input, key = {}) {
    let prev = this.state.prevKeypress;
    this.state.prevKeypress = key;
    if (this.options.multiline === true && key.name === 'return') {
      if (!prev || prev.name !== 'return') {
        return this.append('\n', key);
      }
    }
    return super.keypress(input, key);
  }

  moveCursor(n) {
    this.cursor += n;
  }

  reset() {
    this.input = this.value = '';
    this.cursor = 0;
    return this.render();
  }

  dispatch(ch, key) {
    if (!ch || key.ctrl || key.code) return this.alert();
    this.append(ch);
  }

  append(ch) {
    let { cursor, input } = this.state;
    this.input = `${input}`.slice(0, cursor) + ch + `${input}`.slice(cursor);
    this.moveCursor(String(ch).length);
    this.render();
  }

  insert(str) {
    this.append(str);
  }

  delete() {
    let { cursor, input } = this.state;
    if (cursor <= 0) return this.alert();
    this.input = `${input}`.slice(0, cursor - 1) + `${input}`.slice(cursor);
    this.moveCursor(-1);
    this.render();
  }

  deleteForward() {
    let { cursor, input } = this.state;
    if (input[cursor] === void 0) return this.alert();
    this.input = `${input}`.slice(0, cursor) + `${input}`.slice(cursor + 1);
    this.render();
  }

  cutForward() {
    let pos = this.cursor;
    if (this.input.length <= pos) return this.alert();
    this.state.clipboard.push(this.input.slice(pos));
    this.input = this.input.slice(0, pos);
    this.render();
  }

  cutLeft() {
    let pos = this.cursor;
    if (pos === 0) return this.alert();
    let before = this.input.slice(0, pos);
    let after = this.input.slice(pos);
    let words = before.split(' ');
    this.state.clipboard.push(words.pop());
    this.input = words.join(' ');
    this.cursor = this.input.length;
    this.input += after;
    this.render();
  }

  paste() {
    if (!this.state.clipboard.length) return this.alert();
    this.insert(this.state.clipboard.pop());
    this.render();
  }

  toggleCursor() {
    if (this.state.prevCursor) {
      this.cursor = this.state.prevCursor;
      this.state.prevCursor = 0;
    } else {
      this.state.prevCursor = this.cursor;
      this.cursor = 0;
    }
    this.render();
  }

  first() {
    this.cursor = 0;
    this.render();
  }

  last() {
    this.cursor = this.input.length - 1;
    this.render();
  }

  next() {
    let init = this.initial != null ? String(this.initial) : '';
    if (!init || !init.startsWith(this.input)) return this.alert();
    this.input = this.initial;
    this.cursor = this.initial.length;
    this.render();
  }

  prev() {
    if (!this.input) return this.alert();
    this.reset();
  }

  backward() {
    return this.left();
  }

  forward() {
    return this.right();
  }

  right() {
    if (this.cursor >= this.input.length) return this.alert();
    this.moveCursor(1);
    return this.render();
  }

  left() {
    if (this.cursor <= 0) return this.alert();
    this.moveCursor(-1);
    return this.render();
  }

  isValue(value) {
    return !!value;
  }

  async format(input = this.value) {
    let initial = await this.resolve(this.initial, this.state);
    if (!this.state.submitted) {
      return placeholder(this, { input, initial, pos: this.cursor });
    }
    return this.styles.submitted(input || initial);
  }

  async render() {
    let size = this.state.size;

    let prefix = await this.prefix();
    let separator = await this.separator();
    let message = await this.message();

    let prompt = [prefix, message, separator].filter(Boolean).join(' ');
    this.state.prompt = prompt;

    let header = await this.header();
    let output = await this.format();
    let help = (await this.error()) || (await this.hint());
    let footer = await this.footer();

    if (help && !output.includes(help)) output += ' ' + help;
    prompt += ' ' + output;

    this.clear(size);
    this.write([header, prompt, footer].filter(Boolean).join('\n'));
    this.restore();
  }
}

var string = StringPrompt;

const unique = arr => arr.filter((v, i) => arr.lastIndexOf(v) === i);
const compact = arr => unique(arr).filter(Boolean);

var completer = (action, data = {}, value = '') => {
  let { past = [], present = '' } = data;
  let rest, prev;

  switch (action) {
    case 'prev':
    case 'undo':
      rest = past.slice(0, past.length - 1);
      prev = past[past.length - 1] || '';
      return {
        past: compact([value, ...rest]),
        present: prev
      };

    case 'next':
    case 'redo':
      rest = past.slice(1);
      prev = past[0] || '';
      return {
        past: compact([...rest, value]),
        present: prev
      };

    case 'save':
      return {
        past: compact([...past, value]),
        present: ''
      };

    case 'remove':
      prev = compact(past.filter(v => v !== value));
      present = '';

      if (prev.length) {
        present = prev.pop();
      }

      return {
        past: prev,
        present
      };

    default: {
      throw new Error(`Invalid action: "${action}"`);
    }
  }
};

class Input extends string {
  constructor(options) {
    super(options);
    let history = this.options.history;
    if (history && history.store) {
      let initial = history.values || this.initial;
      this.autosave = !!history.autosave;
      this.store = history.store;
      this.data = this.store.get('values') || { past: [], present: initial };
      this.initial = this.data.present || this.data.past[this.data.past.length - 1];
    }
  }

  completion(action) {
    if (!this.store) return this.alert();
    this.data = completer(action, this.data, this.input);
    if (!this.data.present) return this.alert();
    this.input = this.data.present;
    this.cursor = this.input.length;
    return this.render();
  }

  altUp() {
    return this.completion('prev');
  }

  altDown() {
    return this.completion('next');
  }

  prev() {
    this.save();
    return super.prev();
  }

  save() {
    if (!this.store) return;
    this.data = completer('save', this.data, this.input);
    this.store.set('values', this.data);
  }

  submit() {
    if (this.store && this.autosave === true) {
      this.save();
    }
    return super.submit();
  }
}

var input = Input;

class InvisiblePrompt extends string {
  format() {
    return '';
  }
}

var invisible = InvisiblePrompt;

class ListPrompt extends string {
  constructor(options = {}) {
    super(options);
    this.sep = this.options.separator || /, */;
    this.initial = options.initial || '';
  }

  split(input = this.value) {
    return input ? String(input).split(this.sep) : [];
  }

  format() {
    let style = this.state.submitted ? this.styles.primary : val => val;
    return this.list.map(style).join(', ');
  }

  async submit(value) {
    let result = this.state.error || await this.validate(this.list, this.state);
    if (result !== true) {
      this.state.error = result;
      return super.submit();
    }
    this.value = this.list;
    return super.submit();
  }

  get list() {
    return this.split();
  }
}

var list = ListPrompt;

class MultiSelect extends select {
  constructor(options) {
    super({ ...options, multiple: true });
  }
}

var multiselect = MultiSelect;

class NumberPrompt extends string {
  constructor(options = {}) {
    super({ style: 'number', ...options });
    this.min = this.isValue(options.min) ? this.toNumber(options.min) : -Infinity;
    this.max = this.isValue(options.max) ? this.toNumber(options.max) : Infinity;
    this.delay = options.delay != null ? options.delay : 1000;
    this.float = options.float !== false;
    this.round = options.round === true || options.float === false;
    this.major = options.major || 10;
    this.minor = options.minor || 1;
    this.initial = options.initial != null ? options.initial : '';
    this.input = String(this.initial);
    this.cursor = this.input.length;
    this.cursorShow();
  }

  append(ch) {
    if (!/[-+.]/.test(ch) || (ch === '.' && this.input.includes('.'))) {
      return this.alert('invalid number');
    }
    return super.append(ch);
  }

  number(ch) {
    return super.append(ch);
  }

  next() {
    if (this.input && this.input !== this.initial) return this.alert();
    if (!this.isValue(this.initial)) return this.alert();
    this.input = this.initial;
    this.cursor = String(this.initial).length;
    return this.render();
  }

  up(number) {
    let step = number || this.minor;
    let num = this.toNumber(this.input);
    if (num > this.max + step) return this.alert();
    this.input = `${num + step}`;
    return this.render();
  }

  down(number) {
    let step = number || this.minor;
    let num = this.toNumber(this.input);
    if (num < this.min - step) return this.alert();
    this.input = `${num - step}`;
    return this.render();
  }

  shiftDown() {
    return this.down(this.major);
  }

  shiftUp() {
    return this.up(this.major);
  }

  format(input = this.input) {
    if (typeof this.options.format === 'function') {
      return this.options.format.call(this, input);
    }
    return this.styles.info(input);
  }

  toNumber(value = '') {
    return this.float ? +value : Math.round(+value);
  }

  isValue(value) {
    return /^[-+]?[0-9]+((\.)|(\.[0-9]+))?$/.test(value);
  }

  submit() {
    let value = [this.input, this.initial].find(v => this.isValue(v));
    this.value = this.toNumber(value || 0);
    return super.submit();
  }
}

var number = NumberPrompt;

var numeral = number;

class PasswordPrompt extends string {
  constructor(options) {
    super(options);
    this.cursorShow();
  }

  format(input = this.input) {
    if (!this.keypressed) return '';
    let color = this.state.submitted ? this.styles.primary : this.styles.muted;
    return color(this.symbols.asterisk.repeat(input.length));
  }
}

var password = PasswordPrompt;

class LikertScale extends array {
  constructor(options = {}) {
    super(options);
    this.widths = [].concat(options.messageWidth || 50);
    this.align = [].concat(options.align || 'left');
    this.linebreak = options.linebreak || false;
    this.edgeLength = options.edgeLength || 3;
    this.newline = options.newline || '\n   ';
    let start = options.startNumber || 1;
    if (typeof this.scale === 'number') {
      this.scaleKey = false;
      this.scale = Array(this.scale).fill(0).map((v, i) => ({ name: i + start }));
    }
  }

  async reset() {
    this.tableized = false;
    await super.reset();
    return this.render();
  }

  tableize() {
    if (this.tableized === true) return;
    this.tableized = true;
    let longest = 0;

    for (let ch of this.choices) {
      longest = Math.max(longest, ch.message.length);
      ch.scaleIndex = ch.initial || 2;
      ch.scale = [];

      for (let i = 0; i < this.scale.length; i++) {
        ch.scale.push({ index: i });
      }
    }
    this.widths[0] = Math.min(this.widths[0], longest + 3);
  }

  async dispatch(s, key) {
    if (this.multiple) {
      return this[key.name] ? await this[key.name](s, key) : await super.dispatch(s, key);
    }
    this.alert();
  }

  heading(msg, item, i) {
    return this.styles.strong(msg);
  }

  separator() {
    return this.styles.muted(this.symbols.ellipsis);
  }

  right() {
    let choice = this.focused;
    if (choice.scaleIndex >= this.scale.length - 1) return this.alert();
    choice.scaleIndex++;
    return this.render();
  }

  left() {
    let choice = this.focused;
    if (choice.scaleIndex <= 0) return this.alert();
    choice.scaleIndex--;
    return this.render();
  }

  indent() {
    return '';
  }

  format() {
    if (this.state.submitted) {
      let values = this.choices.map(ch => this.styles.info(ch.index));
      return values.join(', ');
    }
    return '';
  }

  pointer() {
    return '';
  }

  /**
   * Render the scale "Key". Something like:
   * @return {String}
   */

  renderScaleKey() {
    if (this.scaleKey === false) return '';
    if (this.state.submitted) return '';
    let scale = this.scale.map(item => `   ${item.name} - ${item.message}`);
    let key = ['', ...scale].map(item => this.styles.muted(item));
    return key.join('\n');
  }

  /**
   * Render the heading row for the scale.
   * @return {String}
   */

  renderScaleHeading(max) {
    let keys = this.scale.map(ele => ele.name);
    if (typeof this.options.renderScaleHeading === 'function') {
      keys = this.options.renderScaleHeading.call(this, max);
    }
    let diff = this.scaleLength - keys.join('').length;
    let spacing = Math.round(diff / (keys.length - 1));
    let names = keys.map(key => this.styles.strong(key));
    let headings = names.join(' '.repeat(spacing));
    let padding = ' '.repeat(this.widths[0]);
    return this.margin[3] + padding + this.margin[1] + headings;
  }

  /**
   * Render a scale indicator => ◯ or ◉ by default
   */

  scaleIndicator(choice, item, i) {
    if (typeof this.options.scaleIndicator === 'function') {
      return this.options.scaleIndicator.call(this, choice, item, i);
    }
    let enabled = choice.scaleIndex === item.index;
    if (item.disabled) return this.styles.hint(this.symbols.radio.disabled);
    if (enabled) return this.styles.success(this.symbols.radio.on);
    return this.symbols.radio.off;
  }

  /**
   * Render the actual scale => ◯────◯────◉────◯────◯
   */

  renderScale(choice, i) {
    let scale = choice.scale.map(item => this.scaleIndicator(choice, item, i));
    let padding = this.term === 'Hyper' ? '' : ' ';
    return scale.join(padding + this.symbols.line.repeat(this.edgeLength));
  }

  /**
   * Render a choice, including scale =>
   *   "The website is easy to navigate. ◯───◯───◉───◯───◯"
   */

  async renderChoice(choice, i) {
    await this.onChoice(choice, i);

    let focused = this.index === i;
    let pointer = await this.pointer(choice, i);
    let hint = await choice.hint;

    if (hint && !utils.hasColor(hint)) {
      hint = this.styles.muted(hint);
    }

    let pad = str => this.margin[3] + str.replace(/\s+$/, '').padEnd(this.widths[0], ' ');
    let newline = this.newline;
    let ind = this.indent(choice);
    let message = await this.resolve(choice.message, this.state, choice, i);
    let scale = await this.renderScale(choice, i);
    let margin = this.margin[1] + this.margin[3];
    this.scaleLength = ansiColors.unstyle(scale).length;
    this.widths[0] = Math.min(this.widths[0], this.width - this.scaleLength - margin.length);
    let msg = utils.wordWrap(message, { width: this.widths[0], newline });
    let lines = msg.split('\n').map(line => pad(line) + this.margin[1]);

    if (focused) {
      scale = this.styles.info(scale);
      lines = lines.map(line => this.styles.info(line));
    }

    lines[0] += scale;

    if (this.linebreak) lines.push('');
    return [ind + pointer, lines.join('\n')].filter(Boolean);
  }

  async renderChoices() {
    if (this.state.submitted) return '';
    this.tableize();
    let choices = this.visible.map(async(ch, i) => await this.renderChoice(ch, i));
    let visible = await Promise.all(choices);
    let heading = await this.renderScaleHeading();
    return this.margin[0] + [heading, ...visible.map(v => v.join(' '))].join('\n');
  }

  async render() {
    let { submitted, size } = this.state;

    let prefix = await this.prefix();
    let separator = await this.separator();
    let message = await this.message();

    let prompt = '';
    if (this.options.promptLine !== false) {
      prompt = [prefix, message, separator, ''].join(' ');
      this.state.prompt = prompt;
    }

    let header = await this.header();
    let output = await this.format();
    let key = await this.renderScaleKey();
    let help = await this.error() || await this.hint();
    let body = await this.renderChoices();
    let footer = await this.footer();
    let err = this.emptyError;

    if (output) prompt += output;
    if (help && !prompt.includes(help)) prompt += ' ' + help;

    if (submitted && !output && !body.trim() && this.multiple && err != null) {
      prompt += this.styles.danger(err);
    }

    this.clear(size);
    this.write([header, prompt, key, body, footer].filter(Boolean).join('\n'));
    if (!this.state.submitted) {
      this.write(this.margin[2]);
    }
    this.restore();
  }

  submit() {
    this.value = {};
    for (let choice of this.choices) {
      this.value[choice.name] = choice.scaleIndex;
    }
    return this.base.submit.call(this);
  }
}

var scale = LikertScale;

const clean = (str = '') => {
  return typeof str === 'string' ? str.replace(/^['"]|['"]$/g, '') : '';
};

/**
 * This file contains the interpolation and rendering logic for
 * the Snippet prompt.
 */

class Item {
  constructor(token) {
    this.name = token.key;
    this.field = token.field || {};
    this.value = clean(token.initial || this.field.initial || '');
    this.message = token.message || this.name;
    this.cursor = 0;
    this.input = '';
    this.lines = [];
  }
}

const tokenize = async(options = {}, defaults = {}, fn = token => token) => {
  let unique = new Set();
  let fields = options.fields || [];
  let input = options.template;
  let tabstops = [];
  let items = [];
  let keys = [];
  let line = 1;

  if (typeof input === 'function') {
    input = await input();
  }

  let i = -1;
  let next = () => input[++i];
  let peek = () => input[i + 1];
  let push = token => {
    token.line = line;
    tabstops.push(token);
  };

  push({ type: 'bos', value: '' });

  while (i < input.length - 1) {
    let value = next();

    if (/^[^\S\n ]$/.test(value)) {
      push({ type: 'text', value });
      continue;
    }

    if (value === '\n') {
      push({ type: 'newline', value });
      line++;
      continue;
    }

    if (value === '\\') {
      value += next();
      push({ type: 'text', value });
      continue;
    }

    if ((value === '$' || value === '#' || value === '{') && peek() === '{') {
      let n = next();
      value += n;

      let token = { type: 'template', open: value, inner: '', close: '', value };
      let ch;

      while ((ch = next())) {
        if (ch === '}') {
          if (peek() === '}') ch += next();
          token.value += ch;
          token.close = ch;
          break;
        }

        if (ch === ':') {
          token.initial = '';
          token.key = token.inner;
        } else if (token.initial !== void 0) {
          token.initial += ch;
        }

        token.value += ch;
        token.inner += ch;
      }

      token.template = token.open + (token.initial || token.inner) + token.close;
      token.key = token.key || token.inner;

      if (defaults.hasOwnProperty(token.key)) {
        token.initial = defaults[token.key];
      }

      token = fn(token);
      push(token);

      keys.push(token.key);
      unique.add(token.key);

      let item = items.find(item => item.name === token.key);
      token.field = fields.find(ch => ch.name === token.key);

      if (!item) {
        item = new Item(token);
        items.push(item);
      }

      item.lines.push(token.line - 1);
      continue;
    }

    let last = tabstops[tabstops.length - 1];
    if (last.type === 'text' && last.line === line) {
      last.value += value;
    } else {
      push({ type: 'text', value });
    }
  }

  push({ type: 'eos', value: '' });
  return { input, tabstops, unique, keys, items };
};

var interpolate = async prompt => {
  let options = prompt.options;
  let required = new Set(options.required === true ? [] : (options.required || []));
  let defaults = { ...options.values, ...options.initial };
  let { tabstops, items, keys } = await tokenize(options, defaults);

  let result = createFn('result', prompt);
  let format = createFn('format', prompt);
  let isValid = createFn('validate', prompt, options, true);
  let isVal = prompt.isValue.bind(prompt);

  return async(state = {}, submitted = false) => {
    let index = 0;

    state.required = required;
    state.items = items;
    state.keys = keys;
    state.output = '';

    let validate = async(value, state, item, index) => {
      let error = await isValid(value, state, item, index);
      if (error === false) {
        return 'Invalid field ' + item.name;
      }
      return error;
    };

    for (let token of tabstops) {
      let value = token.value;
      let key = token.key;

      if (token.type !== 'template') {
        if (value) state.output += value;
        continue;
      }

      if (token.type === 'template') {
        let item = items.find(ch => ch.name === key);

        if (options.required === true) {
          state.required.add(item.name);
        }

        let val = [item.input, state.values[item.value], item.value, value].find(isVal);
        let field = item.field || {};
        let message = field.message || token.inner;

        if (submitted) {
          let error = await validate(state.values[key], state, item, index);
          if ((error && typeof error === 'string') || error === false) {
            state.invalid.set(key, error);
            continue;
          }

          state.invalid.delete(key);
          let res = await result(state.values[key], state, item, index);
          state.output += ansiColors.unstyle(res);
          continue;
        }

        item.placeholder = false;

        let before = value;
        value = await format(value, state, item, index);

        if (val !== value) {
          state.values[key] = val;
          value = prompt.styles.typing(val);
          state.missing.delete(message);

        } else {
          state.values[key] = void 0;
          val = `<${message}>`;
          value = prompt.styles.primary(val);
          item.placeholder = true;

          if (state.required.has(key)) {
            state.missing.add(message);
          }
        }

        if (state.missing.has(message) && state.validating) {
          value = prompt.styles.warning(val);
        }

        if (state.invalid.has(key) && state.validating) {
          value = prompt.styles.danger(val);
        }

        if (index === state.index) {
          if (before !== value) {
            value = prompt.styles.underline(value);
          } else {
            value = prompt.styles.heading(ansiColors.unstyle(value));
          }
        }

        index++;
      }

      if (value) {
        state.output += value;
      }
    }

    let lines = state.output.split('\n').map(l => ' ' + l);
    let len = items.length;
    let done = 0;

    for (let item of items) {
      if (state.invalid.has(item.name)) {
        item.lines.forEach(i => {
          if (lines[i][0] !== ' ') return;
          lines[i] = state.styles.danger(state.symbols.bullet) + lines[i].slice(1);
        });
      }

      if (prompt.isValue(state.values[item.name])) {
        done++;
      }
    }

    state.completed = ((done / len) * 100).toFixed(0);
    state.output = lines.join('\n');
    return state.output;
  };
};

function createFn(prop, prompt, options, fallback) {
  return (value, state, item, index) => {
    if (typeof item.field[prop] === 'function') {
      return item.field[prop].call(prompt, value, state, item, index);
    }
    return [fallback, value].find(v => prompt.isValue(v));
  };
}

class SnippetPrompt extends prompt {
  constructor(options) {
    super(options);
    this.cursorHide();
    this.reset(true);
  }

  async initialize() {
    this.interpolate = await interpolate(this);
    await super.initialize();
  }

  async reset(first) {
    this.state.keys = [];
    this.state.invalid = new Map();
    this.state.missing = new Set();
    this.state.completed = 0;
    this.state.values = {};

    if (first !== true) {
      await this.initialize();
      await this.render();
    }
  }

  moveCursor(n) {
    let item = this.getItem();
    this.cursor += n;
    item.cursor += n;
  }

  dispatch(ch, key) {
    if (!key.code && !key.ctrl && ch != null && this.getItem()) {
      this.append(ch, key);
      return;
    }
    this.alert();
  }

  append(ch, key) {
    let item = this.getItem();
    let prefix = item.input.slice(0, this.cursor);
    let suffix = item.input.slice(this.cursor);
    this.input = item.input = `${prefix}${ch}${suffix}`;
    this.moveCursor(1);
    this.render();
  }

  delete() {
    let item = this.getItem();
    if (this.cursor <= 0 || !item.input) return this.alert();
    let suffix = item.input.slice(this.cursor);
    let prefix = item.input.slice(0, this.cursor - 1);
    this.input = item.input = `${prefix}${suffix}`;
    this.moveCursor(-1);
    this.render();
  }

  increment(i) {
    return i >= this.state.keys.length - 1 ? 0 : i + 1;
  }

  decrement(i) {
    return i <= 0 ? this.state.keys.length - 1 : i - 1;
  }

  first() {
    this.state.index = 0;
    this.render();
  }

  last() {
    this.state.index = this.state.keys.length - 1;
    this.render();
  }

  right() {
    if (this.cursor >= this.input.length) return this.alert();
    this.moveCursor(1);
    this.render();
  }

  left() {
    if (this.cursor <= 0) return this.alert();
    this.moveCursor(-1);
    this.render();
  }

  prev() {
    this.state.index = this.decrement(this.state.index);
    this.getItem();
    this.render();
  }

  next() {
    this.state.index = this.increment(this.state.index);
    this.getItem();
    this.render();
  }

  up() {
    this.prev();
  }

  down() {
    this.next();
  }

  format(value) {
    let color = this.state.completed < 100 ? this.styles.warning : this.styles.success;
    if (this.state.submitted === true && this.state.completed !== 100) {
      color = this.styles.danger;
    }
    return color(`${this.state.completed}% completed`);
  }

  async render() {
    let { index, keys = [], submitted, size } = this.state;

    let newline = [this.options.newline, '\n'].find(v => v != null);
    let prefix = await this.prefix();
    let separator = await this.separator();
    let message = await this.message();

    let prompt = [prefix, message, separator].filter(Boolean).join(' ');
    this.state.prompt = prompt;

    let header = await this.header();
    let error = (await this.error()) || '';
    let hint = (await this.hint()) || '';
    let body = submitted ? '' : await this.interpolate(this.state);

    let key = this.state.key = keys[index] || '';
    let input = await this.format(key);
    let footer = await this.footer();
    if (input) prompt += ' ' + input;
    if (hint && !input && this.state.completed === 0) prompt += ' ' + hint;

    this.clear(size);
    let lines = [header, prompt, body, footer, error.trim()];
    this.write(lines.filter(Boolean).join(newline));
    this.restore();
  }

  getItem(name) {
    let { items, keys, index } = this.state;
    let item = items.find(ch => ch.name === keys[index]);
    if (item && item.input != null) {
      this.input = item.input;
      this.cursor = item.cursor;
    }
    return item;
  }

  async submit() {
    if (typeof this.interpolate !== 'function') await this.initialize();
    await this.interpolate(this.state, true);

    let { invalid, missing, output, values } = this.state;
    if (invalid.size) {
      let err = '';
      for (let [key, value] of invalid) err += `Invalid ${key}: ${value}\n`;
      this.state.error = err;
      return super.submit();
    }

    if (missing.size) {
      this.state.error = 'Required: ' + [...missing.keys()].join(', ');
      return super.submit();
    }

    let lines = ansiColors.unstyle(output).split('\n');
    let result = lines.map(v => v.slice(1)).join('\n');
    this.value = { values, result };
    return super.submit();
  }
}

var snippet = SnippetPrompt;

const hint = '(Use <shift>+<up/down> to sort)';


class Sort extends select {
  constructor(options) {
    super({ ...options, reorder: false, sort: true, multiple: true });
    this.state.hint = [this.options.hint, hint].find(this.isValue.bind(this));
  }

  indicator() {
    return '';
  }

  async renderChoice(choice, i) {
    let str = await super.renderChoice(choice, i);
    let sym = this.symbols.identicalTo + ' ';
    let pre = (this.index === i && this.sorting) ? this.styles.muted(sym) : '  ';
    if (this.options.drag === false) pre = '';
    if (this.options.numbered === true) {
      return pre + `${i + 1} - ` + str;
    }
    return pre + str;
  }

  get selected() {
    return this.choices;
  }

  submit() {
    this.value = this.choices.map(choice => choice.value);
    return super.submit();
  }
}

var sort = Sort;

class Survey extends array {
  constructor(options = {}) {
    super(options);
    this.emptyError = options.emptyError || 'No items were selected';
    this.term = process.env.TERM_PROGRAM;

    if (!this.options.header) {
      let header = ['', '4 - Strongly Agree', '3 - Agree', '2 - Neutral', '1 - Disagree', '0 - Strongly Disagree', ''];
      header = header.map(ele => this.styles.muted(ele));
      this.state.header = header.join('\n   ');
    }
  }

  async toChoices(...args) {
    if (this.createdScales) return false;
    this.createdScales = true;
    let choices = await super.toChoices(...args);
    for (let choice of choices) {
      choice.scale = createScale(5, this.options);
      choice.scaleIdx = 2;
    }
    return choices;
  }

  dispatch() {
    this.alert();
  }

  space() {
    let choice = this.focused;
    let ele = choice.scale[choice.scaleIdx];
    let selected = ele.selected;
    choice.scale.forEach(e => (e.selected = false));
    ele.selected = !selected;
    return this.render();
  }

  indicator() {
    return '';
  }

  pointer() {
    return '';
  }

  separator() {
    return this.styles.muted(this.symbols.ellipsis);
  }

  right() {
    let choice = this.focused;
    if (choice.scaleIdx >= choice.scale.length - 1) return this.alert();
    choice.scaleIdx++;
    return this.render();
  }

  left() {
    let choice = this.focused;
    if (choice.scaleIdx <= 0) return this.alert();
    choice.scaleIdx--;
    return this.render();
  }

  indent() {
    return '   ';
  }

  async renderChoice(item, i) {
    await this.onChoice(item, i);
    let focused = this.index === i;
    let isHyper = this.term === 'Hyper';
    let n = !isHyper ? 8 : 9;
    let s = !isHyper ? ' ' : '';
    let ln = this.symbols.line.repeat(n);
    let sp = ' '.repeat(n + (isHyper ? 0 : 1));
    let dot = enabled => (enabled ? this.styles.success('◉') : '◯') + s;

    let num = i + 1 + '.';
    let color = focused ? this.styles.heading : this.styles.noop;
    let msg = await this.resolve(item.message, this.state, item, i);
    let indent = this.indent(item);
    let scale = indent + item.scale.map((e, i) => dot(i === item.scaleIdx)).join(ln);
    let val = i => i === item.scaleIdx ? color(i) : i;
    let next = indent + item.scale.map((e, i) => val(i)).join(sp);

    let line = () => [num, msg].filter(Boolean).join(' ');
    let lines = () => [line(), scale, next, ' '].filter(Boolean).join('\n');

    if (focused) {
      scale = this.styles.cyan(scale);
      next = this.styles.cyan(next);
    }

    return lines();
  }

  async renderChoices() {
    if (this.state.submitted) return '';
    let choices = this.visible.map(async(ch, i) => await this.renderChoice(ch, i));
    let visible = await Promise.all(choices);
    if (!visible.length) visible.push(this.styles.danger('No matching choices'));
    return visible.join('\n');
  }

  format() {
    if (this.state.submitted) {
      let values = this.choices.map(ch => this.styles.info(ch.scaleIdx));
      return values.join(', ');
    }
    return '';
  }

  async render() {
    let { submitted, size } = this.state;

    let prefix = await this.prefix();
    let separator = await this.separator();
    let message = await this.message();

    let prompt = [prefix, message, separator].filter(Boolean).join(' ');
    this.state.prompt = prompt;

    let header = await this.header();
    let output = await this.format();
    let help = await this.error() || await this.hint();
    let body = await this.renderChoices();
    let footer = await this.footer();

    if (output || !help) prompt += ' ' + output;
    if (help && !prompt.includes(help)) prompt += ' ' + help;

    if (submitted && !output && !body && this.multiple && this.type !== 'form') {
      prompt += this.styles.danger(this.emptyError);
    }

    this.clear(size);
    this.write([prompt, header, body, footer].filter(Boolean).join('\n'));
    this.restore();
  }

  submit() {
    this.value = {};
    for (let choice of this.choices) {
      this.value[choice.name] = choice.scaleIdx;
    }
    return this.base.submit.call(this);
  }
}

function createScale(n, options = {}) {
  if (Array.isArray(options.scale)) {
    return options.scale.map(ele => ({ ...ele }));
  }
  let scale = [];
  for (let i = 1; i < n + 1; i++) scale.push({ i, selected: false });
  return scale;
}

var survey = Survey;

var text = input;

class TogglePrompt extends boolean_1 {
  async initialize() {
    await super.initialize();
    this.value = this.initial = !!this.options.initial;
    this.disabled = this.options.disabled || 'no';
    this.enabled = this.options.enabled || 'yes';
    await this.render();
  }

  reset() {
    this.value = this.initial;
    this.render();
  }

  delete() {
    this.alert();
  }

  toggle() {
    this.value = !this.value;
    this.render();
  }

  enable() {
    if (this.value === true) return this.alert();
    this.value = true;
    this.render();
  }
  disable() {
    if (this.value === false) return this.alert();
    this.value = false;
    this.render();
  }

  up() {
    this.toggle();
  }
  down() {
    this.toggle();
  }
  right() {
    this.toggle();
  }
  left() {
    this.toggle();
  }
  next() {
    this.toggle();
  }
  prev() {
    this.toggle();
  }

  dispatch(ch = '', key) {
    switch (ch.toLowerCase()) {
      case ' ':
        return this.toggle();
      case '1':
      case 'y':
      case 't':
        return this.enable();
      case '0':
      case 'n':
      case 'f':
        return this.disable();
      default: {
        return this.alert();
      }
    }
  }

  format() {
    let active = str => this.styles.primary.underline(str);
    let value = [
      this.value ? this.disabled : active(this.disabled),
      this.value ? active(this.enabled) : this.enabled
    ];
    return value.join(this.styles.muted(' / '));
  }

  async render() {
    let { size } = this.state;

    let header = await this.header();
    let prefix = await this.prefix();
    let separator = await this.separator();
    let message = await this.message();

    let output = await this.format();
    let help = (await this.error()) || (await this.hint());
    let footer = await this.footer();

    let prompt = [prefix, message, separator, output].join(' ');
    this.state.prompt = prompt;

    if (help && !prompt.includes(help)) prompt += ' ' + help;

    this.clear(size);
    this.write([header, prompt, footer].filter(Boolean).join('\n'));
    this.write(this.margin[2]);
    this.restore();
  }
}

var toggle = TogglePrompt;

class Quiz extends select {
  constructor(options) {
    super(options);
    if (typeof this.options.correctChoice !== 'number' || this.options.correctChoice < 0) {
      throw new Error('Please specify the index of the correct answer from the list of choices');
    }
  }

  async toChoices(value, parent) {
    let choices = await super.toChoices(value, parent);
    if (choices.length < 2) {
      throw new Error('Please give at least two choices to the user');
    }
    if (this.options.correctChoice > choices.length) {
      throw new Error('Please specify the index of the correct answer from the list of choices');
    }
    return choices;
  }

  check(state) {
    return state.index === this.options.correctChoice;
  }

  async result(selected) {
    return {
      selectedAnswer: selected,
      correctAnswer: this.options.choices[this.options.correctChoice].value,
      correct: await this.check(this.state)
    };
  }
}

var quiz = Quiz;

var prompts = createCommonjsModule(function (module, exports) {



const define = (key, fn) => {
  utils.defineExport(exports, key, fn);
  utils.defineExport(exports, key.toLowerCase(), fn);
};

define('AutoComplete', () => autocomplete);
define('BasicAuth', () => basicauth);
define('Confirm', () => confirm);
define('Editable', () => editable);
define('Form', () => form);
define('Input', () => input);
define('Invisible', () => invisible);
define('List', () => list);
define('MultiSelect', () => multiselect);
define('Numeral', () => numeral);
define('Password', () => password);
define('Scale', () => scale);
define('Select', () => select);
define('Snippet', () => snippet);
define('Sort', () => sort);
define('Survey', () => survey);
define('Text', () => text);
define('Toggle', () => toggle);
define('Quiz', () => quiz);
});

var types = {
  ArrayPrompt: array,
  AuthPrompt: auth,
  BooleanPrompt: boolean_1,
  NumberPrompt: number,
  StringPrompt: string
};

/**
 * Create an instance of `Enquirer`.
 *
 * ```js
 * const Enquirer = require('enquirer');
 * const enquirer = new Enquirer();
 * ```
 * @name Enquirer
 * @param {Object} `options` (optional) Options to use with all prompts.
 * @param {Object} `answers` (optional) Answers object to initialize with.
 * @api public
 */

class Enquirer extends events {
  constructor(options, answers) {
    super();
    this.options = utils.merge({}, options);
    this.answers = { ...answers };
  }

  /**
   * Register a custom prompt type.
   *
   * ```js
   * const Enquirer = require('enquirer');
   * const enquirer = new Enquirer();
   * enquirer.register('customType', require('./custom-prompt'));
   * ```
   * @name register()
   * @param {String} `type`
   * @param {Function|Prompt} `fn` `Prompt` class, or a function that returns a `Prompt` class.
   * @return {Object} Returns the Enquirer instance
   * @api public
   */

  register(type, fn) {
    if (utils.isObject(type)) {
      for (let key of Object.keys(type)) this.register(key, type[key]);
      return this;
    }
    assert.equal(typeof fn, 'function', 'expected a function');
    let name = type.toLowerCase();
    if (fn.prototype instanceof this.Prompt) {
      this.prompts[name] = fn;
    } else {
      this.prompts[name] = fn(this.Prompt, this);
    }
    return this;
  }

  /**
   * Prompt function that takes a "question" object or array of question objects,
   * and returns an object with responses from the user.
   *
   * ```js
   * const Enquirer = require('enquirer');
   * const enquirer = new Enquirer();
   *
   * const response = await enquirer.prompt({
   *   type: 'input',
   *   name: 'username',
   *   message: 'What is your username?'
   * });
   * console.log(response);
   * ```
   * @name prompt()
   * @param {Array|Object} `questions` Options objects for one or more prompts to run.
   * @return {Promise} Promise that returns an "answers" object with the user's responses.
   * @api public
   */

  async prompt(questions = []) {
    for (let question of [].concat(questions)) {
      try {
        if (typeof question === 'function') question = await question.call(this);
        await this.ask(utils.merge({}, this.options, question));
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return this.answers;
  }

  async ask(question) {
    if (typeof question === 'function') {
      question = await question.call(this);
    }

    let opts = utils.merge({}, this.options, question);
    let { type, name } = question;
    let { set, get } = utils;

    if (typeof type === 'function') {
      type = await type.call(this, question, this.answers);
    }

    if (!type) return this.answers[name];

    assert(this.prompts[type], `Prompt "${type}" is not registered`);

    let prompt = new this.prompts[type](opts);
    let value = get(this.answers, name);

    prompt.state.answers = this.answers;
    prompt.enquirer = this;

    if (name) {
      prompt.on('submit', value => {
        this.emit('answer', name, value, prompt);
        set(this.answers, name, value);
      });
    }

    // bubble events
    let emit = prompt.emit.bind(prompt);
    prompt.emit = (...args) => {
      this.emit.call(this, ...args);
      return emit(...args);
    };

    this.emit('prompt', prompt, this);

    if (opts.autofill && value != null) {
      prompt.value = prompt.input = value;

      // if "autofill=show" render the prompt, otherwise stay "silent"
      if (opts.autofill === 'show') {
        await prompt.submit();
      }
    } else {
      value = prompt.value = await prompt.run();
    }

    return value;
  }

  /**
   * Use an enquirer plugin.
   *
   * ```js
   * const Enquirer = require('enquirer');
   * const enquirer = new Enquirer();
   * const plugin = enquirer => {
   *   // do stuff to enquire instance
   * };
   * enquirer.use(plugin);
   * ```
   * @name use()
   * @param {Function} `plugin` Plugin function that takes an instance of Enquirer.
   * @return {Object} Returns the Enquirer instance.
   * @api public
   */

  use(plugin) {
    plugin.call(this, this);
    return this;
  }

  set Prompt(value) {
    this._Prompt = value;
  }
  get Prompt() {
    return this._Prompt || this.constructor.Prompt;
  }

  get prompts() {
    return this.constructor.prompts;
  }

  static set Prompt(value) {
    this._Prompt = value;
  }
  static get Prompt() {
    return this._Prompt || prompt;
  }

  static get prompts() {
    return prompts;
  }

  static get types() {
    return types;
  }

  /**
   * Prompt function that takes a "question" object or array of question objects,
   * and returns an object with responses from the user.
   *
   * ```js
   * const { prompt } = require('enquirer');
   * const response = await prompt({
   *   type: 'input',
   *   name: 'username',
   *   message: 'What is your username?'
   * });
   * console.log(response);
   * ```
   * @name Enquirer#prompt
   * @param {Array|Object} `questions` Options objects for one or more prompts to run.
   * @return {Promise} Promise that returns an "answers" object with the user's responses.
   * @api public
   */

  static get prompt() {
    const fn = (questions, ...rest) => {
      let enquirer = new this(...rest);
      let emit = enquirer.emit.bind(enquirer);
      enquirer.emit = (...args) => {
        fn.emit(...args);
        return emit(...args);
      };
      return enquirer.prompt(questions);
    };
    utils.mixinEmitter(fn, new events());
    return fn;
  }
}

utils.mixinEmitter(Enquirer, new events());
const prompts$1 = Enquirer.prompts;

for (let name of Object.keys(prompts$1)) {
  let key = name.toLowerCase();

  let run = options => new prompts$1[name](options).run();
  Enquirer.prompt[key] = run;
  Enquirer[key] = run;

  if (!Enquirer[name]) {
    Reflect.defineProperty(Enquirer, name, { get: () => prompts$1[name] });
  }
}

const exp = name => {
  utils.defineExport(Enquirer, name, () => Enquirer.types[name]);
};

exp('ArrayPrompt');
exp('AuthPrompt');
exp('BooleanPrompt');
exp('NumberPrompt');
exp('StringPrompt');

var enquirer = Enquirer;

async function askPrompt(message, type, opts = {})
{
    const { answer } = await enquirer.prompt({
        type,
        message,
        name: 'answer',
        ...opts
    });
    return answer;
}

async function ask(message, defaultValue = false)
{
    const { answer } =  await enquirer.prompt({
        type: 'confirm',
        name: 'answer',
        message,
        initial: Boolean(defaultValue),
    });
    return answer;
}

async function askChoose(message, choices, autocomplete = true)
{
    const { answer } =  await enquirer.prompt({
        type: autocomplete ? 'autocomplete' : 'select',
        name: 'answer',
        limit: 10,
        message,
        choices,
    });
    return answer;
}

async function askPath(message, baseDirectory, exists = true, isDirectory = false, validate = undefined)
{
    const fs = require('fs');
    const path = require('path');
    return await askPrompt(message, 'input', {
        result: value => path.resolve(baseDirectory, value),
        validate: value =>
        {
            const absPath = path.resolve(baseDirectory, value);
            if (validate) validate.call(null, absPath);
            if (!exists) return true;
            if (!fs.existsSync(absPath))
            {
                return "Path does not exist.";
            }
            else
            {
                const stat = fs.lstatSync(absPath);
                if (isDirectory && !stat.isDirectory())
                {
                    return "Path is not a directory.";
                }
                else if (!isDirectory && !stat.isFile())
                {
                    return "Path is not a file.";
                }
            }
            return true;
        }
    });
}

async function askFindFile(message, directory = '.', validate = undefined)
{
    const DIRECTORY_SYMBOL = '\u2192';
    const fs = require('fs');
    const path = require('path');
    directory = path.resolve(directory);

    let result = null;
    do
    {
        const files = fs.readdirSync(directory, { withFileTypes: true });

        const choices = [];
        choices.push({
            message: `${DIRECTORY_SYMBOL} .`,
            value: { directory: true, name: '.' },
        });
        choices.push({
            message: `${DIRECTORY_SYMBOL} ..`,
            value: { directory: true, name: '..' },
        });
        for(const dirent of files)
        {
            if (dirent.isDirectory())
            {
                choices.push({
                    message: `${DIRECTORY_SYMBOL} ${dirent.name}/`,
                    value: { directory: true, name: dirent.name },
                });
            }
            else
            {
                choices.push({
                    message: `  ${dirent.name}`,
                    value: { directory: false, name: dirent.name },
                });
            }
        }

        const prompt = new enquirer.AutoComplete({
            type: 'autocomplete',
            name: 'file',
            message,
            limit: 10,
            choices,
            format: value => {
                if (typeof value === 'string')
                {
                    return directory + '/' + value;
                }
                else
                {
                    return directory + '/' + value.name;
                }
            },
            suggest: (input, choices) =>
            {
                let str = input.toLowerCase();
                const result = choices.filter(ch => ch.message.toLowerCase().includes(str));

                // Add the custom path as a selectable option...
                result.push({ message: input });

                return result;
            },
            validate: value =>
            {
                if (typeof value === 'string')
                {
                    if (!fs.existsSync(path.resolve(directory, value)))
                    {
                        return "File does not exist.";
                    }
                    else
                    {
                        return true;
                    }
                }
                else
                {
                    // It's already been checked to have existed.
                    return true;
                }
            }
        });

        let fileEntry = await prompt.run();
        if (!fileEntry) return null;

        let filePath;

        // Client used the custom path instead...
        if (typeof fileEntry === 'string')
        {
            filePath = path.resolve(directory, fileEntry);
            
            // filePath is guaranteed to exist due to validate()...
            fileEntry = {
                directory: fs.lstatSync(filePath).isDirectory(),
                name: fileEntry,
            };
        }
        // Client picked one from the list...
        else
        {
            filePath = path.resolve(directory, fileEntry.name);
        }

        if (fileEntry.directory)
        {
            directory = filePath;
        }
        else if (!validate || validate.call(null, filePath))
        {
            result = filePath;
            break;
        }
        else
        {
            result = null;
        }

        // Clear it for the next directory...
        prompt.clear();
    }
    while(!result)

    return result;
}

async function askDate(message, defaultValue = undefined)
{
    const result = await askPrompt(message, 'input', {
        initial: defaultValue && stringify(defaultValue, false),
        hint: "YYYY-MM-DD-hh:mm:ss (You don't need the time)",
        validate: value =>
        {
            try
            {
                parse(value);
            }
            catch(e)
            {
                return e.message;
            }
            return true;
        }
    });

    return parse(result);
}

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

var escapeStringRegexp = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

var colorName = {
	"aliceblue": [240, 248, 255],
	"antiquewhite": [250, 235, 215],
	"aqua": [0, 255, 255],
	"aquamarine": [127, 255, 212],
	"azure": [240, 255, 255],
	"beige": [245, 245, 220],
	"bisque": [255, 228, 196],
	"black": [0, 0, 0],
	"blanchedalmond": [255, 235, 205],
	"blue": [0, 0, 255],
	"blueviolet": [138, 43, 226],
	"brown": [165, 42, 42],
	"burlywood": [222, 184, 135],
	"cadetblue": [95, 158, 160],
	"chartreuse": [127, 255, 0],
	"chocolate": [210, 105, 30],
	"coral": [255, 127, 80],
	"cornflowerblue": [100, 149, 237],
	"cornsilk": [255, 248, 220],
	"crimson": [220, 20, 60],
	"cyan": [0, 255, 255],
	"darkblue": [0, 0, 139],
	"darkcyan": [0, 139, 139],
	"darkgoldenrod": [184, 134, 11],
	"darkgray": [169, 169, 169],
	"darkgreen": [0, 100, 0],
	"darkgrey": [169, 169, 169],
	"darkkhaki": [189, 183, 107],
	"darkmagenta": [139, 0, 139],
	"darkolivegreen": [85, 107, 47],
	"darkorange": [255, 140, 0],
	"darkorchid": [153, 50, 204],
	"darkred": [139, 0, 0],
	"darksalmon": [233, 150, 122],
	"darkseagreen": [143, 188, 143],
	"darkslateblue": [72, 61, 139],
	"darkslategray": [47, 79, 79],
	"darkslategrey": [47, 79, 79],
	"darkturquoise": [0, 206, 209],
	"darkviolet": [148, 0, 211],
	"deeppink": [255, 20, 147],
	"deepskyblue": [0, 191, 255],
	"dimgray": [105, 105, 105],
	"dimgrey": [105, 105, 105],
	"dodgerblue": [30, 144, 255],
	"firebrick": [178, 34, 34],
	"floralwhite": [255, 250, 240],
	"forestgreen": [34, 139, 34],
	"fuchsia": [255, 0, 255],
	"gainsboro": [220, 220, 220],
	"ghostwhite": [248, 248, 255],
	"gold": [255, 215, 0],
	"goldenrod": [218, 165, 32],
	"gray": [128, 128, 128],
	"green": [0, 128, 0],
	"greenyellow": [173, 255, 47],
	"grey": [128, 128, 128],
	"honeydew": [240, 255, 240],
	"hotpink": [255, 105, 180],
	"indianred": [205, 92, 92],
	"indigo": [75, 0, 130],
	"ivory": [255, 255, 240],
	"khaki": [240, 230, 140],
	"lavender": [230, 230, 250],
	"lavenderblush": [255, 240, 245],
	"lawngreen": [124, 252, 0],
	"lemonchiffon": [255, 250, 205],
	"lightblue": [173, 216, 230],
	"lightcoral": [240, 128, 128],
	"lightcyan": [224, 255, 255],
	"lightgoldenrodyellow": [250, 250, 210],
	"lightgray": [211, 211, 211],
	"lightgreen": [144, 238, 144],
	"lightgrey": [211, 211, 211],
	"lightpink": [255, 182, 193],
	"lightsalmon": [255, 160, 122],
	"lightseagreen": [32, 178, 170],
	"lightskyblue": [135, 206, 250],
	"lightslategray": [119, 136, 153],
	"lightslategrey": [119, 136, 153],
	"lightsteelblue": [176, 196, 222],
	"lightyellow": [255, 255, 224],
	"lime": [0, 255, 0],
	"limegreen": [50, 205, 50],
	"linen": [250, 240, 230],
	"magenta": [255, 0, 255],
	"maroon": [128, 0, 0],
	"mediumaquamarine": [102, 205, 170],
	"mediumblue": [0, 0, 205],
	"mediumorchid": [186, 85, 211],
	"mediumpurple": [147, 112, 219],
	"mediumseagreen": [60, 179, 113],
	"mediumslateblue": [123, 104, 238],
	"mediumspringgreen": [0, 250, 154],
	"mediumturquoise": [72, 209, 204],
	"mediumvioletred": [199, 21, 133],
	"midnightblue": [25, 25, 112],
	"mintcream": [245, 255, 250],
	"mistyrose": [255, 228, 225],
	"moccasin": [255, 228, 181],
	"navajowhite": [255, 222, 173],
	"navy": [0, 0, 128],
	"oldlace": [253, 245, 230],
	"olive": [128, 128, 0],
	"olivedrab": [107, 142, 35],
	"orange": [255, 165, 0],
	"orangered": [255, 69, 0],
	"orchid": [218, 112, 214],
	"palegoldenrod": [238, 232, 170],
	"palegreen": [152, 251, 152],
	"paleturquoise": [175, 238, 238],
	"palevioletred": [219, 112, 147],
	"papayawhip": [255, 239, 213],
	"peachpuff": [255, 218, 185],
	"peru": [205, 133, 63],
	"pink": [255, 192, 203],
	"plum": [221, 160, 221],
	"powderblue": [176, 224, 230],
	"purple": [128, 0, 128],
	"rebeccapurple": [102, 51, 153],
	"red": [255, 0, 0],
	"rosybrown": [188, 143, 143],
	"royalblue": [65, 105, 225],
	"saddlebrown": [139, 69, 19],
	"salmon": [250, 128, 114],
	"sandybrown": [244, 164, 96],
	"seagreen": [46, 139, 87],
	"seashell": [255, 245, 238],
	"sienna": [160, 82, 45],
	"silver": [192, 192, 192],
	"skyblue": [135, 206, 235],
	"slateblue": [106, 90, 205],
	"slategray": [112, 128, 144],
	"slategrey": [112, 128, 144],
	"snow": [255, 250, 250],
	"springgreen": [0, 255, 127],
	"steelblue": [70, 130, 180],
	"tan": [210, 180, 140],
	"teal": [0, 128, 128],
	"thistle": [216, 191, 216],
	"tomato": [255, 99, 71],
	"turquoise": [64, 224, 208],
	"violet": [238, 130, 238],
	"wheat": [245, 222, 179],
	"white": [255, 255, 255],
	"whitesmoke": [245, 245, 245],
	"yellow": [255, 255, 0],
	"yellowgreen": [154, 205, 50]
};

var conversions = createCommonjsModule(function (module) {
/* MIT license */


// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

var reverseKeywords = {};
for (var key in colorName) {
	if (colorName.hasOwnProperty(key)) {
		reverseKeywords[colorName[key]] = key;
	}
}

var convert = module.exports = {
	rgb: {channels: 3, labels: 'rgb'},
	hsl: {channels: 3, labels: 'hsl'},
	hsv: {channels: 3, labels: 'hsv'},
	hwb: {channels: 3, labels: 'hwb'},
	cmyk: {channels: 4, labels: 'cmyk'},
	xyz: {channels: 3, labels: 'xyz'},
	lab: {channels: 3, labels: 'lab'},
	lch: {channels: 3, labels: 'lch'},
	hex: {channels: 1, labels: ['hex']},
	keyword: {channels: 1, labels: ['keyword']},
	ansi16: {channels: 1, labels: ['ansi16']},
	ansi256: {channels: 1, labels: ['ansi256']},
	hcg: {channels: 3, labels: ['h', 'c', 'g']},
	apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
	gray: {channels: 1, labels: ['gray']}
};

// hide .channels and .labels properties
for (var model in convert) {
	if (convert.hasOwnProperty(model)) {
		if (!('channels' in convert[model])) {
			throw new Error('missing channels property: ' + model);
		}

		if (!('labels' in convert[model])) {
			throw new Error('missing channel labels property: ' + model);
		}

		if (convert[model].labels.length !== convert[model].channels) {
			throw new Error('channel and label counts mismatch: ' + model);
		}

		var channels = convert[model].channels;
		var labels = convert[model].labels;
		delete convert[model].channels;
		delete convert[model].labels;
		Object.defineProperty(convert[model], 'channels', {value: channels});
		Object.defineProperty(convert[model], 'labels', {value: labels});
	}
}

convert.rgb.hsl = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var min = Math.min(r, g, b);
	var max = Math.max(r, g, b);
	var delta = max - min;
	var h;
	var s;
	var l;

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	l = (min + max) / 2;

	if (max === min) {
		s = 0;
	} else if (l <= 0.5) {
		s = delta / (max + min);
	} else {
		s = delta / (2 - max - min);
	}

	return [h, s * 100, l * 100];
};

convert.rgb.hsv = function (rgb) {
	var rdif;
	var gdif;
	var bdif;
	var h;
	var s;

	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var v = Math.max(r, g, b);
	var diff = v - Math.min(r, g, b);
	var diffc = function (c) {
		return (v - c) / 6 / diff + 1 / 2;
	};

	if (diff === 0) {
		h = s = 0;
	} else {
		s = diff / v;
		rdif = diffc(r);
		gdif = diffc(g);
		bdif = diffc(b);

		if (r === v) {
			h = bdif - gdif;
		} else if (g === v) {
			h = (1 / 3) + rdif - bdif;
		} else if (b === v) {
			h = (2 / 3) + gdif - rdif;
		}
		if (h < 0) {
			h += 1;
		} else if (h > 1) {
			h -= 1;
		}
	}

	return [
		h * 360,
		s * 100,
		v * 100
	];
};

convert.rgb.hwb = function (rgb) {
	var r = rgb[0];
	var g = rgb[1];
	var b = rgb[2];
	var h = convert.rgb.hsl(rgb)[0];
	var w = 1 / 255 * Math.min(r, Math.min(g, b));

	b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};

convert.rgb.cmyk = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var c;
	var m;
	var y;
	var k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;

	return [c * 100, m * 100, y * 100, k * 100];
};

/**
 * See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
 * */
function comparativeDistance(x, y) {
	return (
		Math.pow(x[0] - y[0], 2) +
		Math.pow(x[1] - y[1], 2) +
		Math.pow(x[2] - y[2], 2)
	);
}

convert.rgb.keyword = function (rgb) {
	var reversed = reverseKeywords[rgb];
	if (reversed) {
		return reversed;
	}

	var currentClosestDistance = Infinity;
	var currentClosestKeyword;

	for (var keyword in colorName) {
		if (colorName.hasOwnProperty(keyword)) {
			var value = colorName[keyword];

			// Compute comparative distance
			var distance = comparativeDistance(rgb, value);

			// Check if its less, if so set as closest
			if (distance < currentClosestDistance) {
				currentClosestDistance = distance;
				currentClosestKeyword = keyword;
			}
		}
	}

	return currentClosestKeyword;
};

convert.keyword.rgb = function (keyword) {
	return colorName[keyword];
};

convert.rgb.xyz = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;

	// assume sRGB
	r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
	g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
	b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

	var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
	var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
	var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

	return [x * 100, y * 100, z * 100];
};

convert.rgb.lab = function (rgb) {
	var xyz = convert.rgb.xyz(rgb);
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.hsl.rgb = function (hsl) {
	var h = hsl[0] / 360;
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var t1;
	var t2;
	var t3;
	var rgb;
	var val;

	if (s === 0) {
		val = l * 255;
		return [val, val, val];
	}

	if (l < 0.5) {
		t2 = l * (1 + s);
	} else {
		t2 = l + s - l * s;
	}

	t1 = 2 * l - t2;

	rgb = [0, 0, 0];
	for (var i = 0; i < 3; i++) {
		t3 = h + 1 / 3 * -(i - 1);
		if (t3 < 0) {
			t3++;
		}
		if (t3 > 1) {
			t3--;
		}

		if (6 * t3 < 1) {
			val = t1 + (t2 - t1) * 6 * t3;
		} else if (2 * t3 < 1) {
			val = t2;
		} else if (3 * t3 < 2) {
			val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
		} else {
			val = t1;
		}

		rgb[i] = val * 255;
	}

	return rgb;
};

convert.hsl.hsv = function (hsl) {
	var h = hsl[0];
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var smin = s;
	var lmin = Math.max(l, 0.01);
	var sv;
	var v;

	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	smin *= lmin <= 1 ? lmin : 2 - lmin;
	v = (l + s) / 2;
	sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

	return [h, sv * 100, v * 100];
};

convert.hsv.rgb = function (hsv) {
	var h = hsv[0] / 60;
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var hi = Math.floor(h) % 6;

	var f = h - Math.floor(h);
	var p = 255 * v * (1 - s);
	var q = 255 * v * (1 - (s * f));
	var t = 255 * v * (1 - (s * (1 - f)));
	v *= 255;

	switch (hi) {
		case 0:
			return [v, t, p];
		case 1:
			return [q, v, p];
		case 2:
			return [p, v, t];
		case 3:
			return [p, q, v];
		case 4:
			return [t, p, v];
		case 5:
			return [v, p, q];
	}
};

convert.hsv.hsl = function (hsv) {
	var h = hsv[0];
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var vmin = Math.max(v, 0.01);
	var lmin;
	var sl;
	var l;

	l = (2 - s) * v;
	lmin = (2 - s) * vmin;
	sl = s * vmin;
	sl /= (lmin <= 1) ? lmin : 2 - lmin;
	sl = sl || 0;
	l /= 2;

	return [h, sl * 100, l * 100];
};

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
convert.hwb.rgb = function (hwb) {
	var h = hwb[0] / 360;
	var wh = hwb[1] / 100;
	var bl = hwb[2] / 100;
	var ratio = wh + bl;
	var i;
	var v;
	var f;
	var n;

	// wh + bl cant be > 1
	if (ratio > 1) {
		wh /= ratio;
		bl /= ratio;
	}

	i = Math.floor(6 * h);
	v = 1 - bl;
	f = 6 * h - i;

	if ((i & 0x01) !== 0) {
		f = 1 - f;
	}

	n = wh + f * (v - wh); // linear interpolation

	var r;
	var g;
	var b;
	switch (i) {
		default:
		case 6:
		case 0: r = v; g = n; b = wh; break;
		case 1: r = n; g = v; b = wh; break;
		case 2: r = wh; g = v; b = n; break;
		case 3: r = wh; g = n; b = v; break;
		case 4: r = n; g = wh; b = v; break;
		case 5: r = v; g = wh; b = n; break;
	}

	return [r * 255, g * 255, b * 255];
};

convert.cmyk.rgb = function (cmyk) {
	var c = cmyk[0] / 100;
	var m = cmyk[1] / 100;
	var y = cmyk[2] / 100;
	var k = cmyk[3] / 100;
	var r;
	var g;
	var b;

	r = 1 - Math.min(1, c * (1 - k) + k);
	g = 1 - Math.min(1, m * (1 - k) + k);
	b = 1 - Math.min(1, y * (1 - k) + k);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.rgb = function (xyz) {
	var x = xyz[0] / 100;
	var y = xyz[1] / 100;
	var z = xyz[2] / 100;
	var r;
	var g;
	var b;

	r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
	g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
	b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

	// assume sRGB
	r = r > 0.0031308
		? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
		: r * 12.92;

	g = g > 0.0031308
		? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
		: g * 12.92;

	b = b > 0.0031308
		? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
		: b * 12.92;

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.lab = function (xyz) {
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.lab.xyz = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var x;
	var y;
	var z;

	y = (l + 16) / 116;
	x = a / 500 + y;
	z = y - b / 200;

	var y2 = Math.pow(y, 3);
	var x2 = Math.pow(x, 3);
	var z2 = Math.pow(z, 3);
	y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
	x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
	z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

	x *= 95.047;
	y *= 100;
	z *= 108.883;

	return [x, y, z];
};

convert.lab.lch = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var hr;
	var h;
	var c;

	hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;

	if (h < 0) {
		h += 360;
	}

	c = Math.sqrt(a * a + b * b);

	return [l, c, h];
};

convert.lch.lab = function (lch) {
	var l = lch[0];
	var c = lch[1];
	var h = lch[2];
	var a;
	var b;
	var hr;

	hr = h / 360 * 2 * Math.PI;
	a = c * Math.cos(hr);
	b = c * Math.sin(hr);

	return [l, a, b];
};

convert.rgb.ansi16 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];
	var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2]; // hsv -> ansi16 optimization

	value = Math.round(value / 50);

	if (value === 0) {
		return 30;
	}

	var ansi = 30
		+ ((Math.round(b / 255) << 2)
		| (Math.round(g / 255) << 1)
		| Math.round(r / 255));

	if (value === 2) {
		ansi += 60;
	}

	return ansi;
};

convert.hsv.ansi16 = function (args) {
	// optimization here; we already know the value and don't need to get
	// it converted for us.
	return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
};

convert.rgb.ansi256 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];

	// we use the extended greyscale palette here, with the exception of
	// black and white. normal palette only has 4 greyscale shades.
	if (r === g && g === b) {
		if (r < 8) {
			return 16;
		}

		if (r > 248) {
			return 231;
		}

		return Math.round(((r - 8) / 247) * 24) + 232;
	}

	var ansi = 16
		+ (36 * Math.round(r / 255 * 5))
		+ (6 * Math.round(g / 255 * 5))
		+ Math.round(b / 255 * 5);

	return ansi;
};

convert.ansi16.rgb = function (args) {
	var color = args % 10;

	// handle greyscale
	if (color === 0 || color === 7) {
		if (args > 50) {
			color += 3.5;
		}

		color = color / 10.5 * 255;

		return [color, color, color];
	}

	var mult = (~~(args > 50) + 1) * 0.5;
	var r = ((color & 1) * mult) * 255;
	var g = (((color >> 1) & 1) * mult) * 255;
	var b = (((color >> 2) & 1) * mult) * 255;

	return [r, g, b];
};

convert.ansi256.rgb = function (args) {
	// handle greyscale
	if (args >= 232) {
		var c = (args - 232) * 10 + 8;
		return [c, c, c];
	}

	args -= 16;

	var rem;
	var r = Math.floor(args / 36) / 5 * 255;
	var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
	var b = (rem % 6) / 5 * 255;

	return [r, g, b];
};

convert.rgb.hex = function (args) {
	var integer = ((Math.round(args[0]) & 0xFF) << 16)
		+ ((Math.round(args[1]) & 0xFF) << 8)
		+ (Math.round(args[2]) & 0xFF);

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.hex.rgb = function (args) {
	var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
	if (!match) {
		return [0, 0, 0];
	}

	var colorString = match[0];

	if (match[0].length === 3) {
		colorString = colorString.split('').map(function (char) {
			return char + char;
		}).join('');
	}

	var integer = parseInt(colorString, 16);
	var r = (integer >> 16) & 0xFF;
	var g = (integer >> 8) & 0xFF;
	var b = integer & 0xFF;

	return [r, g, b];
};

convert.rgb.hcg = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var max = Math.max(Math.max(r, g), b);
	var min = Math.min(Math.min(r, g), b);
	var chroma = (max - min);
	var grayscale;
	var hue;

	if (chroma < 1) {
		grayscale = min / (1 - chroma);
	} else {
		grayscale = 0;
	}

	if (chroma <= 0) {
		hue = 0;
	} else
	if (max === r) {
		hue = ((g - b) / chroma) % 6;
	} else
	if (max === g) {
		hue = 2 + (b - r) / chroma;
	} else {
		hue = 4 + (r - g) / chroma + 4;
	}

	hue /= 6;
	hue %= 1;

	return [hue * 360, chroma * 100, grayscale * 100];
};

convert.hsl.hcg = function (hsl) {
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var c = 1;
	var f = 0;

	if (l < 0.5) {
		c = 2.0 * s * l;
	} else {
		c = 2.0 * s * (1.0 - l);
	}

	if (c < 1.0) {
		f = (l - 0.5 * c) / (1.0 - c);
	}

	return [hsl[0], c * 100, f * 100];
};

convert.hsv.hcg = function (hsv) {
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;

	var c = s * v;
	var f = 0;

	if (c < 1.0) {
		f = (v - c) / (1 - c);
	}

	return [hsv[0], c * 100, f * 100];
};

convert.hcg.rgb = function (hcg) {
	var h = hcg[0] / 360;
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	if (c === 0.0) {
		return [g * 255, g * 255, g * 255];
	}

	var pure = [0, 0, 0];
	var hi = (h % 1) * 6;
	var v = hi % 1;
	var w = 1 - v;
	var mg = 0;

	switch (Math.floor(hi)) {
		case 0:
			pure[0] = 1; pure[1] = v; pure[2] = 0; break;
		case 1:
			pure[0] = w; pure[1] = 1; pure[2] = 0; break;
		case 2:
			pure[0] = 0; pure[1] = 1; pure[2] = v; break;
		case 3:
			pure[0] = 0; pure[1] = w; pure[2] = 1; break;
		case 4:
			pure[0] = v; pure[1] = 0; pure[2] = 1; break;
		default:
			pure[0] = 1; pure[1] = 0; pure[2] = w;
	}

	mg = (1.0 - c) * g;

	return [
		(c * pure[0] + mg) * 255,
		(c * pure[1] + mg) * 255,
		(c * pure[2] + mg) * 255
	];
};

convert.hcg.hsv = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var v = c + g * (1.0 - c);
	var f = 0;

	if (v > 0.0) {
		f = c / v;
	}

	return [hcg[0], f * 100, v * 100];
};

convert.hcg.hsl = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var l = g * (1.0 - c) + 0.5 * c;
	var s = 0;

	if (l > 0.0 && l < 0.5) {
		s = c / (2 * l);
	} else
	if (l >= 0.5 && l < 1.0) {
		s = c / (2 * (1 - l));
	}

	return [hcg[0], s * 100, l * 100];
};

convert.hcg.hwb = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;
	var v = c + g * (1.0 - c);
	return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert.hwb.hcg = function (hwb) {
	var w = hwb[1] / 100;
	var b = hwb[2] / 100;
	var v = 1 - b;
	var c = v - w;
	var g = 0;

	if (c < 1) {
		g = (v - c) / (1 - c);
	}

	return [hwb[0], c * 100, g * 100];
};

convert.apple.rgb = function (apple) {
	return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
};

convert.rgb.apple = function (rgb) {
	return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
};

convert.gray.rgb = function (args) {
	return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

convert.gray.hsl = convert.gray.hsv = function (args) {
	return [0, 0, args[0]];
};

convert.gray.hwb = function (gray) {
	return [0, 100, gray[0]];
};

convert.gray.cmyk = function (gray) {
	return [0, 0, 0, gray[0]];
};

convert.gray.lab = function (gray) {
	return [gray[0], 0, 0];
};

convert.gray.hex = function (gray) {
	var val = Math.round(gray[0] / 100 * 255) & 0xFF;
	var integer = (val << 16) + (val << 8) + val;

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.rgb.gray = function (rgb) {
	var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
	return [val / 255 * 100];
};
});
var conversions_1 = conversions.rgb;
var conversions_2 = conversions.hsl;
var conversions_3 = conversions.hsv;
var conversions_4 = conversions.hwb;
var conversions_5 = conversions.cmyk;
var conversions_6 = conversions.xyz;
var conversions_7 = conversions.lab;
var conversions_8 = conversions.lch;
var conversions_9 = conversions.hex;
var conversions_10 = conversions.keyword;
var conversions_11 = conversions.ansi16;
var conversions_12 = conversions.ansi256;
var conversions_13 = conversions.hcg;
var conversions_14 = conversions.apple;
var conversions_15 = conversions.gray;

/*
	this function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/

function buildGraph() {
	var graph = {};
	// https://jsperf.com/object-keys-vs-for-in-with-closure/3
	var models = Object.keys(conversions);

	for (var len = models.length, i = 0; i < len; i++) {
		graph[models[i]] = {
			// http://jsperf.com/1-vs-infinity
			// micro-opt, but this is simple.
			distance: -1,
			parent: null
		};
	}

	return graph;
}

// https://en.wikipedia.org/wiki/Breadth-first_search
function deriveBFS(fromModel) {
	var graph = buildGraph();
	var queue = [fromModel]; // unshift -> queue -> pop

	graph[fromModel].distance = 0;

	while (queue.length) {
		var current = queue.pop();
		var adjacents = Object.keys(conversions[current]);

		for (var len = adjacents.length, i = 0; i < len; i++) {
			var adjacent = adjacents[i];
			var node = graph[adjacent];

			if (node.distance === -1) {
				node.distance = graph[current].distance + 1;
				node.parent = current;
				queue.unshift(adjacent);
			}
		}
	}

	return graph;
}

function link(from, to) {
	return function (args) {
		return to(from(args));
	};
}

function wrapConversion(toModel, graph) {
	var path = [graph[toModel].parent, toModel];
	var fn = conversions[graph[toModel].parent][toModel];

	var cur = graph[toModel].parent;
	while (graph[cur].parent) {
		path.unshift(graph[cur].parent);
		fn = link(conversions[graph[cur].parent][cur], fn);
		cur = graph[cur].parent;
	}

	fn.conversion = path;
	return fn;
}

var route = function (fromModel) {
	var graph = deriveBFS(fromModel);
	var conversion = {};

	var models = Object.keys(graph);
	for (var len = models.length, i = 0; i < len; i++) {
		var toModel = models[i];
		var node = graph[toModel];

		if (node.parent === null) {
			// no possible conversion, or this node is the source model.
			continue;
		}

		conversion[toModel] = wrapConversion(toModel, graph);
	}

	return conversion;
};

var convert = {};

var models = Object.keys(conversions);

function wrapRaw(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		return fn(args);
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

function wrapRounded(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		var result = fn(args);

		// we're assuming the result is an array here.
		// see notice in conversions.js; don't use box types
		// in conversion functions.
		if (typeof result === 'object') {
			for (var len = result.length, i = 0; i < len; i++) {
				result[i] = Math.round(result[i]);
			}
		}

		return result;
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

models.forEach(function (fromModel) {
	convert[fromModel] = {};

	Object.defineProperty(convert[fromModel], 'channels', {value: conversions[fromModel].channels});
	Object.defineProperty(convert[fromModel], 'labels', {value: conversions[fromModel].labels});

	var routes = route(fromModel);
	var routeModels = Object.keys(routes);

	routeModels.forEach(function (toModel) {
		var fn = routes[toModel];

		convert[fromModel][toModel] = wrapRounded(fn);
		convert[fromModel][toModel].raw = wrapRaw(fn);
	});
});

var colorConvert = convert;

var ansiStyles = createCommonjsModule(function (module) {


const wrapAnsi16 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${code + offset}m`;
};

const wrapAnsi256 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};5;${code}m`;
};

const wrapAnsi16m = (fn, offset) => function () {
	const rgb = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
};

function assembleStyles() {
	const codes = new Map();
	const styles = {
		modifier: {
			reset: [0, 0],
			// 21 isn't widely supported and 22 does the same thing
			bold: [1, 22],
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		color: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39],

			// Bright color
			redBright: [91, 39],
			greenBright: [92, 39],
			yellowBright: [93, 39],
			blueBright: [94, 39],
			magentaBright: [95, 39],
			cyanBright: [96, 39],
			whiteBright: [97, 39]
		},
		bgColor: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49],

			// Bright color
			bgBlackBright: [100, 49],
			bgRedBright: [101, 49],
			bgGreenBright: [102, 49],
			bgYellowBright: [103, 49],
			bgBlueBright: [104, 49],
			bgMagentaBright: [105, 49],
			bgCyanBright: [106, 49],
			bgWhiteBright: [107, 49]
		}
	};

	// Fix humans
	styles.color.grey = styles.color.gray;

	for (const groupName of Object.keys(styles)) {
		const group = styles[groupName];

		for (const styleName of Object.keys(group)) {
			const style = group[styleName];

			styles[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};

			group[styleName] = styles[styleName];

			codes.set(style[0], style[1]);
		}

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});

		Object.defineProperty(styles, 'codes', {
			value: codes,
			enumerable: false
		});
	}

	const ansi2ansi = n => n;
	const rgb2rgb = (r, g, b) => [r, g, b];

	styles.color.close = '\u001B[39m';
	styles.bgColor.close = '\u001B[49m';

	styles.color.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 0)
	};
	styles.color.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 0)
	};
	styles.color.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 0)
	};

	styles.bgColor.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 10)
	};
	styles.bgColor.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 10)
	};
	styles.bgColor.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 10)
	};

	for (let key of Object.keys(colorConvert)) {
		if (typeof colorConvert[key] !== 'object') {
			continue;
		}

		const suite = colorConvert[key];

		if (key === 'ansi16') {
			key = 'ansi';
		}

		if ('ansi16' in suite) {
			styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
			styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
		}

		if ('ansi256' in suite) {
			styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
			styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
		}

		if ('rgb' in suite) {
			styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
			styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
		}
	}

	return styles;
}

// Make the export immutable
Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});
});

var hasFlag = (flag, argv) => {
	argv = argv || process.argv;
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const pos = argv.indexOf(prefix + flag);
	const terminatorPos = argv.indexOf('--');
	return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
};

const env = process.env;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false')) {
	forceColor = false;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = true;
}
if ('FORCE_COLOR' in env) {
	forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(stream) {
	if (forceColor === false) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (stream && !stream.isTTY && forceColor !== true) {
		return 0;
	}

	const min = forceColor ? 1 : 0;

	if (process.platform === 'win32') {
		// Node.js 7.5.0 is the first version of Node.js to include a patch to
		// libuv that enables 256 color output on Windows. Anything earlier and it
		// won't work. However, here we target Node.js 8 at minimum as it is an LTS
		// release, and Node.js 7 is not. Windows 10 build 10586 is the first Windows
		// release that supports 256 colors. Windows 10 build 14931 is the first release
		// that supports 16m/TrueColor.
		const osRelease = os.release().split('.');
		if (
			Number(process.versions.node.split('.')[0]) >= 8 &&
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	if (env.TERM === 'dumb') {
		return min;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream);
	return translateLevel(level);
}

var supportsColor_1 = {
	supportsColor: getSupportLevel,
	stdout: getSupportLevel(process.stdout),
	stderr: getSupportLevel(process.stderr)
};

const TEMPLATE_REGEX = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
const ESCAPE_REGEX = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;

const ESCAPES = new Map([
	['n', '\n'],
	['r', '\r'],
	['t', '\t'],
	['b', '\b'],
	['f', '\f'],
	['v', '\v'],
	['0', '\0'],
	['\\', '\\'],
	['e', '\u001B'],
	['a', '\u0007']
]);

function unescape(c) {
	if ((c[0] === 'u' && c.length === 5) || (c[0] === 'x' && c.length === 3)) {
		return String.fromCharCode(parseInt(c.slice(1), 16));
	}

	return ESCAPES.get(c) || c;
}

function parseArguments(name, args) {
	const results = [];
	const chunks = args.trim().split(/\s*,\s*/g);
	let matches;

	for (const chunk of chunks) {
		if (!isNaN(chunk)) {
			results.push(Number(chunk));
		} else if ((matches = chunk.match(STRING_REGEX))) {
			results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, chr) => escape ? unescape(escape) : chr));
		} else {
			throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
		}
	}

	return results;
}

function parseStyle(style) {
	STYLE_REGEX.lastIndex = 0;

	const results = [];
	let matches;

	while ((matches = STYLE_REGEX.exec(style)) !== null) {
		const name = matches[1];

		if (matches[2]) {
			const args = parseArguments(name, matches[2]);
			results.push([name].concat(args));
		} else {
			results.push([name]);
		}
	}

	return results;
}

function buildStyle(chalk, styles) {
	const enabled = {};

	for (const layer of styles) {
		for (const style of layer.styles) {
			enabled[style[0]] = layer.inverse ? null : style.slice(1);
		}
	}

	let current = chalk;
	for (const styleName of Object.keys(enabled)) {
		if (Array.isArray(enabled[styleName])) {
			if (!(styleName in current)) {
				throw new Error(`Unknown Chalk style: ${styleName}`);
			}

			if (enabled[styleName].length > 0) {
				current = current[styleName].apply(current, enabled[styleName]);
			} else {
				current = current[styleName];
			}
		}
	}

	return current;
}

var templates = (chalk, tmp) => {
	const styles = [];
	const chunks = [];
	let chunk = [];

	// eslint-disable-next-line max-params
	tmp.replace(TEMPLATE_REGEX, (m, escapeChar, inverse, style, close, chr) => {
		if (escapeChar) {
			chunk.push(unescape(escapeChar));
		} else if (style) {
			const str = chunk.join('');
			chunk = [];
			chunks.push(styles.length === 0 ? str : buildStyle(chalk, styles)(str));
			styles.push({inverse, styles: parseStyle(style)});
		} else if (close) {
			if (styles.length === 0) {
				throw new Error('Found extraneous } in Chalk template literal');
			}

			chunks.push(buildStyle(chalk, styles)(chunk.join('')));
			chunk = [];
			styles.pop();
		} else {
			chunk.push(chr);
		}
	});

	chunks.push(chunk.join(''));

	if (styles.length > 0) {
		const errMsg = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
		throw new Error(errMsg);
	}

	return chunks.join('');
};

var chalk$1 = createCommonjsModule(function (module) {


const stdoutColor = supportsColor_1.stdout;



const isSimpleWindowsTerm = process.platform === 'win32' && !(process.env.TERM || '').toLowerCase().startsWith('xterm');

// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m'];

// `color-convert` models to exclude from the Chalk API due to conflicts and such
const skipModels = new Set(['gray']);

const styles = Object.create(null);

function applyOptions(obj, options) {
	options = options || {};

	// Detect level if not set manually
	const scLevel = stdoutColor ? stdoutColor.level : 0;
	obj.level = options.level === undefined ? scLevel : options.level;
	obj.enabled = 'enabled' in options ? options.enabled : obj.level > 0;
}

function Chalk(options) {
	// We check for this.template here since calling `chalk.constructor()`
	// by itself will have a `this` of a previously constructed chalk object
	if (!this || !(this instanceof Chalk) || this.template) {
		const chalk = {};
		applyOptions(chalk, options);

		chalk.template = function () {
			const args = [].slice.call(arguments);
			return chalkTag.apply(null, [chalk.template].concat(args));
		};

		Object.setPrototypeOf(chalk, Chalk.prototype);
		Object.setPrototypeOf(chalk.template, chalk);

		chalk.template.constructor = Chalk;

		return chalk.template;
	}

	applyOptions(this, options);
}

// Use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles.blue.open = '\u001B[94m';
}

for (const key of Object.keys(ansiStyles)) {
	ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

	styles[key] = {
		get() {
			const codes = ansiStyles[key];
			return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, key);
		}
	};
}

styles.visible = {
	get() {
		return build.call(this, this._styles || [], true, 'visible');
	}
};

ansiStyles.color.closeRe = new RegExp(escapeStringRegexp(ansiStyles.color.close), 'g');
for (const model of Object.keys(ansiStyles.color.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	styles[model] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.color[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.color.close,
					closeRe: ansiStyles.color.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

ansiStyles.bgColor.closeRe = new RegExp(escapeStringRegexp(ansiStyles.bgColor.close), 'g');
for (const model of Object.keys(ansiStyles.bgColor.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.bgColor[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.bgColor.close,
					closeRe: ansiStyles.bgColor.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

const proto = Object.defineProperties(() => {}, styles);

function build(_styles, _empty, key) {
	const builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder._empty = _empty;

	const self = this;

	Object.defineProperty(builder, 'level', {
		enumerable: true,
		get() {
			return self.level;
		},
		set(level) {
			self.level = level;
		}
	});

	Object.defineProperty(builder, 'enabled', {
		enumerable: true,
		get() {
			return self.enabled;
		},
		set(enabled) {
			self.enabled = enabled;
		}
	});

	// See below for fix regarding invisible grey/dim combination on Windows
	builder.hasGrey = this.hasGrey || key === 'gray' || key === 'grey';

	// `__proto__` is used because we must return a function, but there is
	// no way to create a function with a different prototype
	builder.__proto__ = proto; // eslint-disable-line no-proto

	return builder;
}

function applyStyle() {
	// Support varags, but simply cast to string in case there's only one arg
	const args = arguments;
	const argsLen = args.length;
	let str = String(arguments[0]);

	if (argsLen === 0) {
		return '';
	}

	if (argsLen > 1) {
		// Don't slice `arguments`, it prevents V8 optimizations
		for (let a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || this.level <= 0 || !str) {
		return this._empty ? '' : str;
	}

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	const originalDim = ansiStyles.dim.open;
	if (isSimpleWindowsTerm && this.hasGrey) {
		ansiStyles.dim.open = '';
	}

	for (const code of this._styles.slice().reverse()) {
		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;

		// Close the styling before a linebreak and reopen
		// after next line to fix a bleed issue on macOS
		// https://github.com/chalk/chalk/pull/92
		str = str.replace(/\r?\n/g, `${code.close}$&${code.open}`);
	}

	// Reset the original `dim` if we changed it to work around the Windows dimmed gray issue
	ansiStyles.dim.open = originalDim;

	return str;
}

function chalkTag(chalk, strings) {
	if (!Array.isArray(strings)) {
		// If chalk() was called by itself or with a string,
		// return the string itself as a string.
		return [].slice.call(arguments, 1).join(' ');
	}

	const args = [].slice.call(arguments, 2);
	const parts = [strings.raw[0]];

	for (let i = 1; i < strings.length; i++) {
		parts.push(String(args[i - 1]).replace(/[{}\\]/g, '\\$&'));
		parts.push(String(strings.raw[i]));
	}

	return templates(chalk, parts.join(''));
}

Object.defineProperties(Chalk.prototype, styles);

module.exports = Chalk(); // eslint-disable-line new-cap
module.exports.supportsColor = stdoutColor;
module.exports.default = module.exports; // For TypeScript
});
var chalk_1 = chalk$1.supportsColor;

var figlet_1 = createCommonjsModule(function (module) {

var figlet = figlet || (function() {
    
    // ---------------------------------------------------------------------
    // Private static variables

    var FULL_WIDTH = 0,
        FITTING = 1,
        SMUSHING = 2,
        CONTROLLED_SMUSHING = 3;

    // ---------------------------------------------------------------------
    // Variable that will hold information about the fonts

    var figFonts = {}; // What stores all of the FIGlet font data
    var figDefaults = {
        font: 'Standard',
        fontPath: './fonts'
    };

    // ---------------------------------------------------------------------
    // Private static methods

    /*
        This method takes in the oldLayout and newLayout data from the FIGfont header file and returns
        the layout information.
    */
    function getSmushingRules(oldLayout, newLayout) {
        var rules = {};
        var val, index, len, code;
        var codes = [[16384,"vLayout",SMUSHING], [8192,"vLayout",FITTING], [4096, "vRule5", true], [2048, "vRule4", true],
                     [1024, "vRule3", true], [512, "vRule2", true], [256, "vRule1", true], [128, "hLayout", SMUSHING],
                     [64, "hLayout", FITTING], [32, "hRule6", true], [16, "hRule5", true], [8, "hRule4", true], [4, "hRule3", true],
                     [2, "hRule2", true], [1, "hRule1", true]];

        val = (newLayout !== null) ? newLayout : oldLayout;
        index = 0;
        len = codes.length;
        while ( index < len ) {
            code = codes[index];
            if (val >= code[0]) {
                val = val - code[0];
                rules[code[1]] = (typeof rules[code[1]] === "undefined") ? code[2] : rules[code[1]];
            } else if (code[1] !== "vLayout" && code[1] !== "hLayout") {
                rules[code[1]] = false;
            }
            index++;
        }

        if (typeof rules["hLayout"] === "undefined") {
            if (oldLayout === 0) {
                rules["hLayout"] = FITTING;
            } else if (oldLayout === -1) {
                rules["hLayout"] = FULL_WIDTH;
            } else {
                if (rules["hRule1"] || rules["hRule2"] || rules["hRule3"] || rules["hRule4"] ||rules["hRule5"] || rules["hRule6"] ) {
                    rules["hLayout"] = CONTROLLED_SMUSHING;
                } else {
                    rules["hLayout"] = SMUSHING;
                }
            }
        } else if (rules["hLayout"] === SMUSHING) {
            if (rules["hRule1"] || rules["hRule2"] || rules["hRule3"] || rules["hRule4"] ||rules["hRule5"] || rules["hRule6"] ) {
                rules["hLayout"] = CONTROLLED_SMUSHING;
            }
        }

        if (typeof rules["vLayout"] === "undefined") {
            if (rules["vRule1"] || rules["vRule2"] || rules["vRule3"] || rules["vRule4"] ||rules["vRule5"]  ) {
                rules["vLayout"] = CONTROLLED_SMUSHING;
            } else {
                rules["vLayout"] = FULL_WIDTH;
            }
        } else if (rules["vLayout"] === SMUSHING) {
            if (rules["vRule1"] || rules["vRule2"] || rules["vRule3"] || rules["vRule4"] ||rules["vRule5"]  ) {
                rules["vLayout"] = CONTROLLED_SMUSHING;
            }
        }

        return rules;
    }

    /* The [vh]Rule[1-6]_Smush functions return the smushed character OR false if the two characters can't be smushed */

    /*
        Rule 1: EQUAL CHARACTER SMUSHING (code value 1)

            Two sub-characters are smushed into a single sub-character
            if they are the same.  This rule does not smush
            hardblanks.  (See rule 6 on hardblanks below)
    */
    function hRule1_Smush(ch1, ch2, hardBlank) {
        if (ch1 === ch2 && ch1 !== hardBlank) {return ch1;}
        return false;
    }

    /*
        Rule 2: UNDERSCORE SMUSHING (code value 2)

            An underscore ("_") will be replaced by any of: "|", "/",
            "\", "[", "]", "{", "}", "(", ")", "<" or ">".
    */
    function hRule2_Smush(ch1, ch2) {
        var rule2Str = "|/\\[]{}()<>";
        if (ch1 === "_") {
            if (rule2Str.indexOf(ch2) !== -1) {return ch2;}
        } else if (ch2 === "_") {
            if (rule2Str.indexOf(ch1) !== -1) {return ch1;}
        }
        return false;
    }

    /*
        Rule 3: HIERARCHY SMUSHING (code value 4)

            A hierarchy of six classes is used: "|", "/\", "[]", "{}",
            "()", and "<>".  When two smushing sub-characters are
            from different classes, the one from the latter class
            will be used.
    */
    function hRule3_Smush(ch1, ch2) {
        var rule3Classes = "| /\\ [] {} () <>";
        var r3_pos1 = rule3Classes.indexOf(ch1);
        var r3_pos2 = rule3Classes.indexOf(ch2);
        if (r3_pos1 !== -1 && r3_pos2 !== -1) {
            if (r3_pos1 !== r3_pos2 && Math.abs(r3_pos1-r3_pos2) !== 1) {
                return rule3Classes.substr(Math.max(r3_pos1,r3_pos2), 1);
            }
        }
        return false;
    }

    /*
        Rule 4: OPPOSITE PAIR SMUSHING (code value 8)

            Smushes opposing brackets ("[]" or "]["), braces ("{}" or
            "}{") and parentheses ("()" or ")(") together, replacing
            any such pair with a vertical bar ("|").
    */
    function hRule4_Smush(ch1, ch2) {
        var rule4Str = "[] {} ()";
        var r4_pos1 = rule4Str.indexOf(ch1);
        var r4_pos2 = rule4Str.indexOf(ch2);
        if (r4_pos1 !== -1 && r4_pos2 !== -1) {
            if (Math.abs(r4_pos1-r4_pos2) <= 1) {
                return "|";
            }
        }
        return false;
    }

    /*
        Rule 5: BIG X SMUSHING (code value 16)

            Smushes "/\" into "|", "\/" into "Y", and "><" into "X".
            Note that "<>" is not smushed in any way by this rule.
            The name "BIG X" is historical; originally all three pairs
            were smushed into "X".
    */
    function hRule5_Smush(ch1, ch2) {
        var rule5Str = "/\\ \\/ ><";
        var rule5Hash = {"0": "|", "3": "Y", "6": "X"};
        var r5_pos1 = rule5Str.indexOf(ch1);
        var r5_pos2 = rule5Str.indexOf(ch2);
        if (r5_pos1 !== -1 && r5_pos2 !== -1) {
            if ((r5_pos2-r5_pos1) === 1) {
                return rule5Hash[r5_pos1];
            }
        }
        return false;
    }

    /*
        Rule 6: HARDBLANK SMUSHING (code value 32)

            Smushes two hardblanks together, replacing them with a
            single hardblank.  (See "Hardblanks" below.)
    */
    function hRule6_Smush(ch1, ch2, hardBlank) {
        if (ch1 === hardBlank && ch2 === hardBlank) {
            return hardBlank;
        }
        return false;
    }

    /*
        Rule 1: EQUAL CHARACTER SMUSHING (code value 256)

            Same as horizontal smushing rule 1.
    */
    function vRule1_Smush(ch1, ch2) {
        if (ch1 === ch2) {return ch1;}
        return false;
    }

    /*
        Rule 2: UNDERSCORE SMUSHING (code value 512)

            Same as horizontal smushing rule 2.
    */
    function vRule2_Smush(ch1, ch2) {
        var rule2Str = "|/\\[]{}()<>";
        if (ch1 === "_") {
            if (rule2Str.indexOf(ch2) !== -1) {return ch2;}
        } else if (ch2 === "_") {
            if (rule2Str.indexOf(ch1) !== -1) {return ch1;}
        }
        return false;
    }

    /*
        Rule 3: HIERARCHY SMUSHING (code value 1024)

            Same as horizontal smushing rule 3.
    */
    function vRule3_Smush(ch1, ch2) {
        var rule3Classes = "| /\\ [] {} () <>";
        var r3_pos1 = rule3Classes.indexOf(ch1);
        var r3_pos2 = rule3Classes.indexOf(ch2);
        if (r3_pos1 !== -1 && r3_pos2 !== -1) {
            if (r3_pos1 !== r3_pos2 && Math.abs(r3_pos1-r3_pos2) !== 1) {
                return rule3Classes.substr(Math.max(r3_pos1,r3_pos2), 1);
            }
        }
        return false;
    }

    /*
        Rule 4: HORIZONTAL LINE SMUSHING (code value 2048)

            Smushes stacked pairs of "-" and "_", replacing them with
            a single "=" sub-character.  It does not matter which is
            found above the other.  Note that vertical smushing rule 1
            will smush IDENTICAL pairs of horizontal lines, while this
            rule smushes horizontal lines consisting of DIFFERENT
            sub-characters.
    */
    function vRule4_Smush(ch1, ch2) {
        if ( (ch1 === "-" && ch2 === "_") || (ch1 === "_" && ch2 === "-") ) {
            return "=";
        }
        return false;
    }

    /*
        Rule 5: VERTICAL LINE SUPERSMUSHING (code value 4096)

            This one rule is different from all others, in that it
            "supersmushes" vertical lines consisting of several
            vertical bars ("|").  This creates the illusion that
            FIGcharacters have slid vertically against each other.
            Supersmushing continues until any sub-characters other
            than "|" would have to be smushed.  Supersmushing can
            produce impressive results, but it is seldom possible,
            since other sub-characters would usually have to be
            considered for smushing as soon as any such stacked
            vertical lines are encountered.
    */
    function vRule5_Smush(ch1, ch2) {
        if ( ch1 === "|" && ch2 === "|" ) {
            return "|";
        }
        return false;
    }

    /*
        Universal smushing simply overrides the sub-character from the
        earlier FIGcharacter with the sub-character from the later
        FIGcharacter.  This produces an "overlapping" effect with some
        FIGfonts, wherin the latter FIGcharacter may appear to be "in
        front".
    */
    function uni_Smush(ch1, ch2, hardBlank) {
        if (ch2 === " " || ch2 === "") {
            return ch1;
        } else if (ch2 === hardBlank && ch1 !== " ") {
            return ch1;
        } else {
            return ch2;
        }
    }

    // --------------------------------------------------------------------------
    // main vertical smush routines (excluding rules)

    /*
        txt1 - A line of text
        txt2 - A line of text
        opts - FIGlet options array

        About: Takes in two lines of text and returns one of the following:
        "valid" - These lines can be smushed together given the current smushing rules
        "end" - The lines can be smushed, but we're at a stopping point
        "invalid" - The two lines cannot be smushed together
    */
    function canVerticalSmush(txt1, txt2, opts) {
        if (opts.fittingRules.vLayout === FULL_WIDTH) {return "invalid";}
        var ii, len = Math.min(txt1.length, txt2.length);
        var ch1, ch2, endSmush = false, validSmush;
        if (len===0) {return "invalid";}

        for (ii = 0; ii < len; ii++) {
            ch1 = txt1.substr(ii,1);
            ch2 = txt2.substr(ii,1);
            if (ch1 !== " " && ch2 !== " ") {
                if (opts.fittingRules.vLayout === FITTING) {
                    return "invalid";
                } else if (opts.fittingRules.vLayout === SMUSHING) {
                    return "end";
                } else {
                    if (vRule5_Smush(ch1,ch2)) {endSmush = endSmush || false; continue;} // rule 5 allow for "super" smushing, but only if we're not already ending this smush
                    validSmush = false;
                    validSmush = (opts.fittingRules.vRule1) ? vRule1_Smush(ch1,ch2) : validSmush;
                    validSmush = (!validSmush && opts.fittingRules.vRule2) ? vRule2_Smush(ch1,ch2) : validSmush;
                    validSmush = (!validSmush && opts.fittingRules.vRule3) ? vRule3_Smush(ch1,ch2) : validSmush;
                    validSmush = (!validSmush && opts.fittingRules.vRule4) ? vRule4_Smush(ch1,ch2) : validSmush;
                    endSmush = true;
                    if (!validSmush) {return "invalid";}
                }
            }
        }
        if (endSmush) {
            return "end";
        } else {
            return "valid";
        }
    }

    function getVerticalSmushDist(lines1, lines2, opts) {
        var maxDist = lines1.length;
        var len1 = lines1.length;
        var len2 = lines2.length;
        var subLines1, subLines2, slen;
        var curDist = 1;
        var ii, ret, result;
        while (curDist <= maxDist) {

            subLines1 = lines1.slice(Math.max(0,len1-curDist), len1);
            subLines2 = lines2.slice(0, Math.min(maxDist, curDist));

            slen = subLines2.length;//TODO:check this
            result = "";
            for (ii = 0; ii < slen; ii++) {
                ret = canVerticalSmush(subLines1[ii], subLines2[ii], opts);
                if (ret === "end") {
                    result = ret;
                } else if (ret === "invalid") {
                    result = ret;
                    break;
                } else {
                    if (result === "") {
                        result = "valid";
                    }
                }
            }

            if (result === "invalid") {curDist--;break;}
            if (result === "end") {break;}
            if (result === "valid") {curDist++;}
        }

        return Math.min(maxDist,curDist);
    }

    function verticallySmushLines(line1, line2, opts) {
        var ii, len = Math.min(line1.length, line2.length);
        var ch1, ch2, result = "", validSmush;

        for (ii = 0; ii < len; ii++) {
            ch1 = line1.substr(ii,1);
            ch2 = line2.substr(ii,1);
            if (ch1 !== " " && ch2 !== " ") {
                if (opts.fittingRules.vLayout === FITTING) {
                    result += uni_Smush(ch1,ch2);
                } else if (opts.fittingRules.vLayout === SMUSHING) {
                    result += uni_Smush(ch1,ch2);
                } else {
                    validSmush = (opts.fittingRules.vRule5) ? vRule5_Smush(ch1,ch2) : validSmush;
                    validSmush = (!validSmush && opts.fittingRules.vRule1) ? vRule1_Smush(ch1,ch2) : validSmush;
                    validSmush = (!validSmush && opts.fittingRules.vRule2) ? vRule2_Smush(ch1,ch2) : validSmush;
                    validSmush = (!validSmush && opts.fittingRules.vRule3) ? vRule3_Smush(ch1,ch2) : validSmush;
                    validSmush = (!validSmush && opts.fittingRules.vRule4) ? vRule4_Smush(ch1,ch2) : validSmush;
                    result += validSmush;
                }
            } else {
                result += uni_Smush(ch1,ch2);
            }
        }
        return result;
    }

    function verticalSmush(lines1, lines2, overlap, opts) {
        var len1 = lines1.length;
        var len2 = lines2.length;
        var piece1 = lines1.slice(0, Math.max(0,len1-overlap));
        var piece2_1 = lines1.slice(Math.max(0,len1-overlap), len1);
        var piece2_2 = lines2.slice(0, Math.min(overlap, len2));
        var ii, len, line, piece2 = [], piece3, result = [];

        len = piece2_1.length;
        for (ii = 0; ii < len; ii++) {
            if (ii >= len2) {
                line = piece2_1[ii];
            } else {
                line = verticallySmushLines(piece2_1[ii], piece2_2[ii], opts);
            }
            piece2.push(line);
        }

        piece3 = lines2.slice(Math.min(overlap,len2), len2);

        return result.concat(piece1,piece2,piece3);
    }

    function padLines(lines, numSpaces) {
        var ii, len = lines.length, padding = "";
        for (ii = 0; ii < numSpaces; ii++) {
            padding += " ";
        }
        for (ii = 0; ii < len; ii++) {
            lines[ii] += padding;
        }
    }

    function smushVerticalFigLines(output, lines, opts) {
        var len1 = output[0].length;
        var len2 = lines[0].length;
        var overlap;
        if (len1 > len2) {
            padLines(lines, len1-len2);
        } else if (len2 > len1) {
            padLines(output, len2-len1);
        }
        overlap = getVerticalSmushDist(output, lines, opts);
        return verticalSmush(output, lines, overlap,opts);
    }

    // -------------------------------------------------------------------------
    // Main horizontal smush routines (excluding rules)

    function getHorizontalSmushLength(txt1, txt2, opts) {
        if (opts.fittingRules.hLayout === FULL_WIDTH) {return 0;}
        var ii, len1 = txt1.length, len2 = txt2.length;
        var maxDist = len1;
        var curDist = 1;
        var breakAfter = false;
        var validSmush = false;
        var seg1, seg2, ch1, ch2;
        if (len1 === 0) {return 0;}

        distCal: while (curDist <= maxDist) {
            seg1 = txt1.substr(len1-curDist,curDist);
            seg2 = txt2.substr(0,Math.min(curDist,len2));
            for (ii = 0; ii < Math.min(curDist,len2); ii++) {
                ch1 = seg1.substr(ii,1);
                ch2 = seg2.substr(ii,1);
                if (ch1 !== " " && ch2 !== " " ) {
                    if (opts.fittingRules.hLayout === FITTING) {
                        curDist = curDist - 1;
                        break distCal;
                    } else if (opts.fittingRules.hLayout === SMUSHING) {
                        if (ch1 === opts.hardBlank || ch2 === opts.hardBlank) {
                            curDist = curDist - 1; // universal smushing does not smush hardblanks
                        }
                        break distCal;
                    } else {
                        breakAfter = true; // we know we need to break, but we need to check if our smushing rules will allow us to smush the overlapped characters
                        validSmush = false; // the below checks will let us know if we can smush these characters

                        validSmush = (opts.fittingRules.hRule1) ? hRule1_Smush(ch1,ch2,opts.hardBlank) : validSmush;
                        validSmush = (!validSmush && opts.fittingRules.hRule2) ? hRule2_Smush(ch1,ch2,opts.hardBlank) : validSmush;
                        validSmush = (!validSmush && opts.fittingRules.hRule3) ? hRule3_Smush(ch1,ch2,opts.hardBlank) : validSmush;
                        validSmush = (!validSmush && opts.fittingRules.hRule4) ? hRule4_Smush(ch1,ch2,opts.hardBlank) : validSmush;
                        validSmush = (!validSmush && opts.fittingRules.hRule5) ? hRule5_Smush(ch1,ch2,opts.hardBlank) : validSmush;
                        validSmush = (!validSmush && opts.fittingRules.hRule6) ? hRule6_Smush(ch1,ch2,opts.hardBlank) : validSmush;

                        if (!validSmush) {
                            curDist = curDist - 1;
                            break distCal;
                        }
                    }
                }
            }
            if (breakAfter) {break;}
            curDist++;
        }
        return Math.min(maxDist,curDist);
    }

    function horizontalSmush(textBlock1, textBlock2, overlap, opts) {
        var ii, jj, outputFig = [],
            overlapStart,piece1,piece2,piece3,len1,len2,txt1,txt2;

        for (ii = 0; ii < opts.height; ii++) {
            txt1 = textBlock1[ii];
            txt2 = textBlock2[ii];
            len1 = txt1.length;
            len2 = txt2.length;
            overlapStart = len1-overlap;
            piece1 = txt1.substr(0,Math.max(0,overlapStart));
            piece2 = "";

            // determine overlap piece
            var seg1 = txt1.substr(Math.max(0,len1-overlap),overlap);
            var seg2 = txt2.substr(0,Math.min(overlap,len2));

            for (jj = 0; jj < overlap; jj++) {
                var ch1 = (jj < len1) ? seg1.substr(jj,1) : " ";
                var ch2 = (jj < len2) ? seg2.substr(jj,1) : " ";

                if (ch1 !== " " && ch2 !== " ") {
                    if (opts.fittingRules.hLayout === FITTING) {
                        piece2 += uni_Smush(ch1, ch2, opts.hardBlank);
                    } else if (opts.fittingRules.hLayout === SMUSHING) {
                        piece2 += uni_Smush(ch1, ch2, opts.hardBlank);
                    } else {
                        // Controlled Smushing
                        var nextCh = "";
                        nextCh = (!nextCh && opts.fittingRules.hRule1) ? hRule1_Smush(ch1,ch2,opts.hardBlank) : nextCh;
                        nextCh = (!nextCh && opts.fittingRules.hRule2) ? hRule2_Smush(ch1,ch2,opts.hardBlank) : nextCh;
                        nextCh = (!nextCh && opts.fittingRules.hRule3) ? hRule3_Smush(ch1,ch2,opts.hardBlank) : nextCh;
                        nextCh = (!nextCh && opts.fittingRules.hRule4) ? hRule4_Smush(ch1,ch2,opts.hardBlank) : nextCh;
                        nextCh = (!nextCh && opts.fittingRules.hRule5) ? hRule5_Smush(ch1,ch2,opts.hardBlank) : nextCh;
                        nextCh = (!nextCh && opts.fittingRules.hRule6) ? hRule6_Smush(ch1,ch2,opts.hardBlank) : nextCh;
                        nextCh = nextCh || uni_Smush(ch1, ch2, opts.hardBlank);
                        piece2 += nextCh;
                    }
                } else {
                    piece2 += uni_Smush(ch1, ch2, opts.hardBlank);
                }
            }

            if (overlap >= len2) {
                piece3 = "";
            } else {
                piece3 = txt2.substr(overlap,Math.max(0,len2-overlap));
            }
            outputFig[ii] = piece1 + piece2 + piece3;
        }
        return outputFig;
    }

    function generateFigTextLine(txt, figChars, opts) {
        var charIndex, figChar, overlap = 0, row, outputFigText = [], len=opts.height;
        for (row = 0; row < len; row++) {
            outputFigText[row] = "";
        }
        if (opts.printDirection === 1) {
            txt = txt.split('').reverse().join('');
        }
        len=txt.length;
        for (charIndex = 0; charIndex < len; charIndex++) {
            figChar = figChars[txt.substr(charIndex,1).charCodeAt(0)];
            if (figChar) {
                if (opts.fittingRules.hLayout !== FULL_WIDTH) {
                    overlap = 10000;// a value too high to be the overlap
                    for (row = 0; row < opts.height; row++) {
                        overlap = Math.min(overlap, getHorizontalSmushLength(outputFigText[row], figChar[row], opts));
                    }
                    overlap = (overlap === 10000) ? 0 : overlap;
                }
                outputFigText = horizontalSmush(outputFigText, figChar, overlap, opts);
            }
        }
        // remove hardblanks
        if (opts.showHardBlanks !== true) {
            len = outputFigText.length;
            for (row = 0; row < len; row++) {
                outputFigText[row] = outputFigText[row].replace(new RegExp("\\"+opts.hardBlank,"g")," ");
            }
        }
        return outputFigText;
    }

    // -------------------------------------------------------------------------
    // Parsing and Generation methods

    var getHorizontalFittingRules = function(layout, options) {
        var props = ["hLayout", "hRule1","hRule2","hRule3","hRule4","hRule5","hRule6"],
            params = {}, ii;
        if (layout === "default") {
            for (ii = 0; ii < props.length; ii++) {
                params[props[ii]] = options.fittingRules[props[ii]];
            }
        } else if (layout === "full") {
            params = {"hLayout": FULL_WIDTH,"hRule1":false,"hRule2":false,"hRule3":false,"hRule4":false,"hRule5":false,"hRule6":false};
        } else if (layout === "fitted") {
            params = {"hLayout": FITTING,"hRule1":false,"hRule2":false,"hRule3":false,"hRule4":false,"hRule5":false,"hRule6":false};
        } else if (layout === "controlled smushing") {
            params = {"hLayout": CONTROLLED_SMUSHING,"hRule1":true,"hRule2":true,"hRule3":true,"hRule4":true,"hRule5":true,"hRule6":true};
        } else if (layout === "universal smushing") {
            params = {"hLayout": SMUSHING,"hRule1":false,"hRule2":false,"hRule3":false,"hRule4":false,"hRule5":false,"hRule6":false};
        } else {
            return;
        }
        return params;
    };

    var getVerticalFittingRules = function(layout, options) {
        var props = ["vLayout", "vRule1","vRule2","vRule3","vRule4","vRule5"],
            params = {}, ii;
        if (layout === "default") {
            for (ii = 0; ii < props.length; ii++) {
                params[props[ii]] = options.fittingRules[props[ii]];
            }
        } else if (layout === "full") {
            params = {"vLayout": FULL_WIDTH,"vRule1":false,"vRule2":false,"vRule3":false,"vRule4":false,"vRule5":false};
        } else if (layout === "fitted") {
            params = {"vLayout": FITTING,"vRule1":false,"vRule2":false,"vRule3":false,"vRule4":false,"vRule5":false};
        } else if (layout === "controlled smushing") {
            params = {"vLayout": CONTROLLED_SMUSHING,"vRule1":true,"vRule2":true,"vRule3":true,"vRule4":true,"vRule5":true};
        } else if (layout === "universal smushing") {
            params = {"vLayout": SMUSHING,"vRule1":false,"vRule2":false,"vRule3":false,"vRule4":false,"vRule5":false};
        } else {
            return;
        }
        return params;
    };

    /*
        Generates the ASCII Art
        - fontName: Font to use
        - option: Options to override the defaults
        - txt: The text to make into ASCII Art
    */
    var generateText = function(fontName, options, txt) {
        txt = txt.replace(/\r\n/g,"\n").replace(/\r/g,"\n");
        var lines = txt.split("\n");
        var figLines = [];
        var ii, len, output;
        len = lines.length;
        for (ii = 0; ii < len; ii++) {
            figLines.push( generateFigTextLine(lines[ii], figFonts[fontName], options) );
        }
        len = figLines.length;
        output = figLines[0];
        for (ii = 1; ii < len; ii++) {
            output = smushVerticalFigLines(output, figLines[ii], options);
        }

        return output.join("\n");
    };

    // -------------------------------------------------------------------------
    // Public methods

    /*
        A short-cut for the figlet.text method

        Parameters:
        - txt (string): The text to make into ASCII Art
        - options (object/string - optional): Options that will override the current font's default options.
          If a string is provided instead of an object, it is assumed to be the font name.

            * font
            * horizontalLayout
            * verticalLayout
            * showHardBlanks - Wont remove hardblank characters

        - next (function): A callback function, it will contained the outputted ASCII Art.
    */
    var me = function(txt, options, next) {
        me.text(txt, options, next);
    };
    me.text = function(txt, options, next) {
        var fontName = '';

        // Validate inputs
        txt = txt + '';

        if (typeof arguments[1] === 'function') {
            next = options;
            options = {};
            options.font = figDefaults.font; // default font
        }

        if (typeof options === 'string') {
            fontName = options;
            options = {};
        } else {
            options = options || {};
            fontName = options.font || figDefaults.font;
        }

        /*
            Load the font. If it loads, it's data will be contained in the figFonts object.
            The callback will recieve a fontsOpts object, which contains the default
            options of the font (its fitting rules, etc etc).
        */
        me.loadFont(fontName, function(err, fontOpts) {
            if (err) {
                return next(err);
            }

            next(null, generateText(fontName, _reworkFontOpts(fontOpts, options), txt));
        });
    };

    /*
        Synchronous version of figlet.text.
        Accepts the same parameters.
     */
    me.textSync = function(txt, options) {
        var fontName = '';

        // Validate inputs
        txt = txt + '';

        if (typeof options === 'string') {
            fontName = options;
            options = {};
        } else {
            options = options || {};
            fontName = options.font || figDefaults.font;
        }

        var fontOpts = _reworkFontOpts(me.loadFontSync(fontName), options);
        return generateText(fontName, fontOpts, txt);
    };

    /*
      takes assigned options and merges them with the default options from the choosen font
     */
    function _reworkFontOpts(fontOpts, options) {
        var myOpts = JSON.parse(JSON.stringify(fontOpts)), // make a copy because we may edit this (see below)
            params,
            prop;

        /*
         If the user is chosing to use a specific type of layout (e.g., 'full', 'fitted', etc etc)
         Then we need to override the default font options.
         */
        if (typeof options.horizontalLayout !== 'undefined') {
            params = getHorizontalFittingRules(options.horizontalLayout, fontOpts);
            for (prop in params) {
                myOpts.fittingRules[prop] = params[prop];
            }
        }
        if (typeof options.verticalLayout !== 'undefined') {
            params = getVerticalFittingRules(options.verticalLayout, fontOpts);
            for (prop in params) {
                myOpts.fittingRules[prop] = params[prop];
            }
        }
        myOpts.printDirection = (typeof options.printDirection !== 'undefined') ? options.printDirection : fontOpts.printDirection;
        myOpts.showHardBlanks = options.showHardBlanks || false;

        return myOpts;
    }

    /*
        Returns metadata about a specfic FIGlet font.

        Returns:
            next(err, options, headerComment)
            - err: The error if an error occurred, otherwise null/falsey.
            - options (object): The options defined for the font.
            - headerComment (string): The font's header comment.
    */
    me.metadata = function(fontName, next) {
        fontName = fontName + '';

        /*
            Load the font. If it loads, it's data will be contained in the figFonts object.
            The callback will recieve a fontsOpts object, which contains the default
            options of the font (its fitting rules, etc etc).
        */
        me.loadFont(fontName, function(err, fontOpts) {
            if (err) {
                next(err);
                return;
            }

            next(null, fontOpts, figFonts[fontName].comment);
        });
    };

    /*
        Allows you to override defaults. See the definition of the figDefaults object up above
        to see what properties can be overridden.
        Returns the options for the font.
    */
    me.defaults = function(opts) {
        if (typeof opts === 'object' && opts !== null) {
            for (var prop in opts) {
                if (opts.hasOwnProperty(prop)) {
                    figDefaults[prop] = opts[prop];
                }
            }
        }
        return JSON.parse(JSON.stringify(figDefaults));
    };

    /*
        Parses data from a FIGlet font file and places it into the figFonts object.
    */
    me.parseFont = function(fontName, data) {
        data = data.replace(/\r\n/g,"\n").replace(/\r/g,"\n");
        figFonts[fontName] = {};

        var lines = data.split("\n");
        var headerData = lines.splice(0,1)[0].split(" ");
        var figFont = figFonts[fontName];
        var opts = {};

        opts.hardBlank = headerData[0].substr(5,1);
        opts.height = parseInt(headerData[1], 10);
        opts.baseline = parseInt(headerData[2], 10);
        opts.maxLength = parseInt(headerData[3], 10);
        opts.oldLayout = parseInt(headerData[4], 10);
        opts.numCommentLines = parseInt(headerData[5], 10);
        opts.printDirection = (headerData.length >= 6) ? parseInt(headerData[6], 10) : 0;
        opts.fullLayout = (headerData.length >= 7) ? parseInt(headerData[7], 10) : null;
        opts.codeTagCount = (headerData.length >= 8) ? parseInt(headerData[8], 10) : null;
        opts.fittingRules = getSmushingRules(opts.oldLayout, opts.fullLayout);

        figFont.options = opts;

        // error check
        if (opts.hardBlank.length !== 1 ||
            isNaN(opts.height) ||
            isNaN(opts.baseline) ||
            isNaN(opts.maxLength) ||
            isNaN(opts.oldLayout) ||
            isNaN(opts.numCommentLines) )
        {
            throw new Error('FIGlet header contains invalid values.');
        }

        /*
            All FIGlet fonts must contain chars 32-126, 196, 214, 220, 228, 246, 252, 223
        */

        var charNums = [], ii;
        for (ii = 32; ii <= 126; ii++) {
            charNums.push(ii);
        }
        charNums = charNums.concat(196, 214, 220, 228, 246, 252, 223);

        // error check - validate that there are enough lines in the file
        if (lines.length < (opts.numCommentLines + (opts.height * charNums.length)) ) {
            throw new Error('FIGlet file is missing data.');
        }

        /*
            Parse out the context of the file and put it into our figFont object
        */

        var cNum, endCharRegEx, parseError = false;

        figFont.comment = lines.splice(0,opts.numCommentLines).join("\n");
        figFont.numChars = 0;

        while (lines.length > 0 && figFont.numChars < charNums.length) {
            cNum = charNums[figFont.numChars];
            figFont[cNum] = lines.splice(0,opts.height);
            // remove end sub-chars
            for (ii = 0; ii < opts.height; ii++) {
                if (typeof figFont[cNum][ii] === "undefined") {
                    figFont[cNum][ii] = "";
                } else {
                    endCharRegEx = new RegExp("\\"+figFont[cNum][ii].substr(figFont[cNum][ii].length-1,1)+"+$");
                    figFont[cNum][ii] = figFont[cNum][ii].replace(endCharRegEx,"");
                }
            }
            figFont.numChars++;
        }

        /*
            Now we check to see if any additional characters are present
        */

        while (lines.length > 0) {
            cNum = lines.splice(0,1)[0].split(" ")[0];
            if ( /^0[xX][0-9a-fA-F]+$/.test(cNum) ) {
                cNum = parseInt(cNum, 16);
            } else if ( /^0[0-7]+$/.test(cNum) ) {
                cNum = parseInt(cNum, 8);
            } else if ( /^[0-9]+$/.test(cNum) ) {
                cNum = parseInt(cNum, 10);
            } else if ( /^-0[xX][0-9a-fA-F]+$/.test(cNum) ) {
                cNum = parseInt(cNum, 16);
            } else {
                if (cNum === "") {break;}
                // something's wrong
                console.log("Invalid data:"+cNum);
                parseError = true;
                break;
            }

            figFont[cNum] = lines.splice(0,opts.height);
            // remove end sub-chars
            for (ii = 0; ii < opts.height; ii++) {
                if (typeof figFont[cNum][ii] === "undefined") {
                    figFont[cNum][ii] = "";
                } else {
                    endCharRegEx = new RegExp("\\"+figFont[cNum][ii].substr(figFont[cNum][ii].length-1,1)+"+$");
                    figFont[cNum][ii] = figFont[cNum][ii].replace(endCharRegEx,"");
                }
            }
            figFont.numChars++;
        }

        // error check
        if (parseError === true) {
            throw new Error('Error parsing data.');
        }

        return opts;
    };

    /*
        Loads a font.
    */
    me.loadFont = function(fontName, next) {
        if (figFonts[fontName]) {
            next(null, figFonts[fontName].options);
            return;
        }

        if (typeof fetch !== 'function') {
          console.error('figlet.js requires the fetch API or a fetch polyfill such as https://cdnjs.com/libraries/fetch');
          throw new Error('fetch is required for figlet.js to work.')
        }

        fetch(figDefaults.fontPath + '/' + fontName + '.flf')
            .then(function(response) {
                if(response.ok) {
                    return response.text();
                }
            
                console.log('Unexpected response', response);
                throw new Error('Network response was not ok.');
            })
            .then(function(text) {
                next(null, me.parseFont(fontName, text));
            })
            .catch(next);
    };

    /*
        loads a font synchronously, not implemented for the browser
     */
    me.loadFontSync = function(name) {
        if (figFonts[name]) {
          return figFonts[name].options;
        }
        throw new Error('synchronous font loading is not implemented for the browser');
    };

    /*
        preloads a list of fonts prior to using textSync
        - fonts: an array of font names (i.e. ["Standard","Soft"])
        - next: callback function
     */
    me.preloadFonts = function(fonts, next) {

      if (typeof jQuery === 'undefined') { /* TODO: create common function for jQuery checks */
          throw new Error('jQuery is required for ajax method to work.');
      }

      jQuery.when.apply(this, fonts.map(function(name){
            return jQuery.get(figDefaults.fontPath + '/' + name + '.flf')
          })).then(function() {
                      var args = fonts.length > 1 ? arguments : [arguments];
                      for(var i in fonts){
                        me.parseFont(fonts[i], args[i][0]);
                      }
                      if(next)next();
          });
    };

    me.figFonts = figFonts;
    
    return me;
})();

// for node.js
{
    {
        module.exports = figlet;
    }
}
});

/*
	Node plugin for figlet.js
*/

var fontDir = path$6.join(__dirname, '/../fonts/');

/*
    Loads a font into the figlet object.

    Parameters:
    - name (string): Name of the font to load.
    - next (function): Callback function.
*/
figlet_1.loadFont = function(name, next) {
    if (figlet_1.figFonts[name]) {
        next(null, figlet_1.figFonts[name].options);
        return;
    }

    fs$2.readFile( path$6.join(fontDir, name + '.flf'),  {encoding: 'utf-8'}, function(err, fontData) {
        if (err) {
            return next(err);
        }

        fontData = fontData + '';
        try {
            next(null, figlet_1.parseFont(name, fontData));
        } catch(error) {
            next(error);
        }
    });
};

/*
 Loads a font synchronously into the figlet object.

 Parameters:
 - name (string): Name of the font to load.
 */
figlet_1.loadFontSync = function(name) {
    if (figlet_1.figFonts[name]) {
        return figlet_1.figFonts[name].options;
    }

    var fontData = fs$2.readFileSync( path$6.join(fontDir, name + '.flf'),  {encoding: 'utf-8'});

    fontData = fontData + '';
    return figlet_1.parseFont(name, fontData);
};

/*
    Returns an array containing all of the font names
*/
figlet_1.fonts = function(next) {
    var fontList = [];
    fs$2.readdir(fontDir, function (err, files) { // '/' denotes the root folder
        if (err) {
            return next(err);
        }

        files.forEach( function (file) {
            if ( /\.flf$/.test(file) ) {
                fontList.push( file.replace(/\.flf$/,'') );
            }
        });

        next(null, fontList);
    });

};

figlet_1.fontsSync = function() {
    var fontList = [];
    fs$2.readdirSync(fontDir).forEach(function(file) {
        if ( /\.flf$/.test(file) ) {
            fontList.push( file.replace(/\.flf$/,'') );
        }
    });

    return fontList;
};

var nodeFiglet = figlet_1;

const DIVIDER_LENGTH = 80;
const CHOICE_SEPARATOR = { message: "\n=-=-= END " + "=-".repeat(35) + "\n", role: 'separator' };
const SHOW_STACK_TRACE = true;

function log(message)
{
    console.log(message);
}

function debug(message)
{
    console.log(chalk$1.gray(message));
}

function error(message, expected = false)
{
    console.error(chalk$1.redBright(message));
    
    if (!expected && SHOW_STACK_TRACE)
    {
        console.trace(chalk$1.red(message));
    }
}

function success(message)
{
    console.log(chalk$1.green(message));
}

function motivation()
{
    say(getMotivation());
}

function formattedError(errorMessage, depth = 0)
{
    if (Array.isArray(errorMessage))
    {
        for(const message of errorMessage)
        {
            if (message === '=>')
            {
                depth += 1;
            }
            else if (message === '<=')
            {
                depth -= 1;
            }
            else
            {
                formattedError(message, depth);
            }
        }
    }
    else
    {
        error('  '.repeat(depth) + ' ' + ((depth <= 0) ? '+' : '-') + ' ' + errorMessage);
    }
}

const MAX_SKIPPED_ERRORS = 100;
const SKIPPED_ERRORS = new Set();
const NO_SKIP_ERRORS = new Set();
const FORCE_SKIP_ERRORS = new Set();
async function skippedError(message, reason = undefined)
{
    const errorMessage = message + " - " + (reason instanceof Error ? reason.message : reason);
    error(errorMessage, true);

    const errorHash = stringHash(errorMessage);
    if (FORCE_SKIP_ERRORS.has(errorHash))
    {
        debug("...Auto-skipping error...");
    }
    else if (!(await ask("...Skip the error?", true).catch(e => false)))
    {
        throw new Error("Failed error. Aborting...");
    }
    else if (SKIPPED_ERRORS.has(errorHash))
    {
        try
        {
            if (await ask("...Skip this error in the future?"))
            {
                FORCE_SKIP_ERRORS.add(errorHash);
            }
            else
            {
                NO_SKIP_ERRORS.add(errorHash);
            }
        }
        catch(e)
        {
            // Just ignore it.
        }
    }
    else
    {
        if (SKIPPED_ERRORS.size > MAX_SKIPPED_ERRORS)
        {
            SKIPPED_ERRORS.clear();
        }

        SKIPPED_ERRORS.add(errorHash);
    }
}

function divider(token = 'nu')
{
    log(chalk$1.gray(
        token.repeat(Math.floor(DIVIDER_LENGTH / token.length))
        + token.substring(0, DIVIDER_LENGTH % token.length)
    ));
}

function doTheBigTitleThing(title = 'Progress Auditor', subtitle = 'Version v?.?.?')
{
    divider();
    log(chalk$1.green(nodeFiglet.textSync(title, { font: 'Big' })));
    if (subtitle)
    {
        log(subtitle.padStart(DIVIDER_LENGTH, ' '));
    }
    divider();
}

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Papa = require('papaparse');

function readJSONFile(filepath)
{
    const data = fs.readFileSync(filepath);
    return JSON.parse(data);
}

/**
 * Reads a csv file asynchronously and processes the file by row.
 * @param {String} filepath The file path to the file to be read.
 * @param {Function} callback The callback function to process the row read.
 */
function readCSVFileByRow(filepath, callback)
{
    return new Promise((resolve, reject) => {
        const input = fs.createReadStream(filepath);
        Papa.parse(input, {
            step: (row) => callback(row.data),
            complete: resolve,
            error: reject
        });

    });
}

/**
 * Reads a file asynchronously and processes the file by line.
 * @param {String} filepath The file path to the file to be read.
 * @param {Function} callback The callback function to process the line read.
 */
function readFileByLine(filepath, callback)
{
    return new Promise((resolve, reject) => {
        const input = fs.createReadStream(filepath);
        const rd = readline.createInterface({ input });
        input.on('error', (e) => {
            console.error(e);
            reject(e);
        });
        rd.on('line', callback);
        rd.on('close', () => {
            resolve();
        });
    });
}

async function writeToFile(filepath, content)
{
    fs.mkdirSync(path.dirname(filepath), { recursive: true });

    if (await checkExistsOverwrite(filepath))
    {
        return new Promise((resolve, reject) =>
        {
            fs.writeFile(filepath, content, (err) =>
            {
                if (err) { reject(err); }
                console.log("File saved:", filepath);
                resolve();
            });
        });
    }
}

async function writeTableToCSV(filepath, table)
{
    await writeToFile(filepath, table.map(e => e.join(',')).join('\n'));
}

async function checkExistsOverwrite(filepath)
{
    return !fs.existsSync(filepath) || await ask(`File '${path.basename(filepath)}' already exists. Are you sure you want to overwrite it?`);
}

var FileUtil = /*#__PURE__*/Object.freeze({
    readJSONFile: readJSONFile,
    readCSVFileByRow: readCSVFileByRow,
    readFileByLine: readFileByLine,
    writeToFile: writeToFile,
    writeTableToCSV: writeTableToCSV,
    checkExistsOverwrite: checkExistsOverwrite
});

const IDENTITY = function(a) { return a; };

/**
 * This will build a table by first specifying the template columns
 * the table should have. Then you can "build" the table by
 * supplying the entires.
 */
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

// database
const DATABASE_EXPORTS = {
    Assignment,
    AssignmentDatabase: AssignmentDatabase$1,
    Database,
    DatabaseSetup,
    Review,
    ReviewDatabase,
    Schedule,
    Submission,
    SubmissionDatabase,
    User,
    UserDatabase: UserDatabase$1,
    Vacation,
    VacationDatabase
};
const UTIL_EXPORTS = {
    DateGenerator,
    DateUtil,
    FieldParser,
    FileUtil,
    MathHelper,
    TableBuilder
};

// Named export
const ProgressAuditor = {
    ...DATABASE_EXPORTS,
    ...UTIL_EXPORTS,
};

// Global export
global.ProgressAuditor = ProgressAuditor;

const path$1 = require('path');
const fs$1 = require('fs');

const DEFAULT_CONFIG_FILE_NAME = 'config.json';

/**
 * Loads the config from the filepath. If there exists the 'include' property, it will
 * resolve those dependencies such that they are given priority and loaded first, in the
 * order defined, before this config. Any conflicting properties between configs are
 * either overridden or merged in the order visited. In other words, the last config in
 * the include list will override the first config. If the first config also has an
 * include list, those will load first, and therefore also be overriden by the last config.
 * And this "root" config will override all of them. If the property overriden is an array,
 * it will attempt to merge them instead.
 * 
 * @param {String} configPath The path to the config file.
 * @returns {Object} The config loaded from this file.
 */
async function loadConfig(configPath)
{
    let parentConfig;
    let parentDir;
    try
    {
        configPath = findValidConfigFilePath(configPath);
        parentDir = path$1.dirname(configPath);
    }
    catch(e)
    {
        error(`...Cannot find config at '${configPath}'...`, true);
        return Promise.reject(e);
    }

    try
    {
        const data = fs$1.readFileSync(configPath);
        parentConfig = JSON.parse(data);
    }
    catch(e)
    {
        return Promise.reject([`Failed to parse config file:`, '=>', e, '<=']);
    }

    parentConfig = resolveConfigPaths(parentDir, parentConfig);

    if ('include' in parentConfig)
    {
        const errors = [];
        const configs = [];
        for(const includePath of parentConfig.include)
        {
            try
            {
                const childConfig = await loadConfig(includePath);
                configs.push(childConfig);
            }
            catch(e)
            {
                errors.push(e);
            }
        }

        if (errors.length > 0)
        {
            return Promise.reject([`Failed to resolve config includes:`, '=>', errors, '<=']);
        }

        const mergedConfig = configs.reduce((prev, current) => mergeConfigs(current, prev), {});
        parentConfig = mergeConfigs(parentConfig, mergedConfig);
    }

    return parentConfig;
}

function findValidConfigFilePath(filepath)
{
    if (!fs$1.existsSync(filepath))
    {
        throw new Error(`Cannot find non-existant path '${filepath}'.`);
    }

    if (fs$1.lstatSync(filepath).isDirectory())
    {
        const dirpath = filepath;
        filepath = path$1.resolve(dirpath, DEFAULT_CONFIG_FILE_NAME);

        if (!fs$1.existsSync(filepath))
        {
            throw new Error(`Cannot find config file in directory '${dirpath}'.`);
        }
    }

    return filepath;
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
        // TODO: Implement path macros.
        // const index = value.indexOf('$EXEC_PATH');

        // Don't resolve for absolute or home paths.
        if (value.startsWith('/') || value.startsWith('~/'))
        {
            return path$1.resolve(value);
        }
        // Do resolve for relative paths.
        else
        {
            return path$1.resolve(parentPath, value);
        }
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
 * This file handles the common lifecycle of a resolution process.
 * 
 * Generally, the program would need some kind of input from the
 * client. And the input must be valid. Therefore, if the client
 * provides invalid input, the process should start over and ask
 * for a valid answer again. This handles that.
 * 
 * @module Resolver
 */

function ifFailAndAgain(message, expected = true)
{
    return async result => !result && (Boolean(await ask(message)) === expected);
}

function createResolver()
{
    return {
        _init: () => true,
        _run: () => null,
        _error: null,
        _validate: value => value,
        _again: () => false,
        async resolve()
        {
            try
            {
                let answer = false;
                if (typeof this._init === 'string')
                {
                    answer = await ask(this._init);
                }
                else if (typeof this._init === 'function')
                {
                    answer = this._init.call(null);
                }

                if (answer)
                {
                    let result = null;
                    let running = false;
                    do
                    {
                        running = false;
                        try
                        {
                            result = await this._run.call(null);
                        }
                        catch(e)
                        {
                            if (typeof this._error === 'function')
                            {
                                result = this._error.call(null, e);
                            }
                            else
                            {
                                result = this._error;
                            }
                        }

                        // Try again maybe?
                        if (typeof this._again === 'function')
                        {
                            if (await this._again.call(null, result))
                            {
                                running = true;
                            }
                        }
                        else if (typeof this._again === 'string')
                        {
                            if (await ask(this._again))
                            {
                                running = true;
                            }
                        }
                    }
                    while(running);

                    return result;
                }

                return undefined;
            }
            catch(e)
            {
                if (typeof this._error === 'function')
                {
                    return this._error.call(null, e);
                }
                else
                {
                    return this._error;
                }
            }
        },
        init(value)
        {
            this._init = value;
            return this;
        },
        run(callback)
        {
            this._run = callback;
            return this;
        },
        error(callback)
        {
            this._error = callback;
            return this;
        },
        again(value)
        {
            this._again = value;
            return this;
        }
    }
}

/**
 * Assumes all databases have been properly initialized with data. This
 * will try to resolve all issues through either interactive or automatic
 * reviews.
 * 
 * Interactive reviews require user input to resolve certain errors. These
 * interactions are saved into a "reviews" file to be parsed back later without
 * asking the user for the input again.
 * 
 * Automatic reviews do not have this limitation, therefore it is the preferred
 * way to resolve errors.
 */
class ReviewRegistry
{
    constructor()
    {
        this.reviewMap = new Map();
        this.priorityList = [];
    }
    
    /** The order in which the reviewer is registered is the order they execute. */
    register(review, manualExecute = false)
    {
        if (!review) throw new Error('Cannot register null reviews.');
        if (!('TYPE' in review) || !review.TYPE) throw new Error(`Not a valid review type - missing type. ${review}`)

        this.reviewMap.set(review.TYPE, review);
        
        if (!manualExecute)
        {
            this.priorityList.push(review.TYPE);
        }
        
        return this;
    }

    /** Will apply the reviews to the database. */
    async applyReviews(db, config)
    {
        for(const reviewType of this.priorityList)
        {
            const review = this.reviewMap.get(reviewType);
            try
            {
                await review.review(db, config);
            }
            catch(e)
            {
                await skippedError(`Failed to apply review '${reviewType}'.`, e);
            }
        }
    }

    getReviewByType(type)
    {
        return this.reviewMap.get(type);
    }

    getReviewTypes()
    {
        return this.reviewMap.keys();
    }

    getReviews()
    {
        return this.reviewMap.values();
    }
}

const INSTANCE = new ReviewRegistry();

function createReviewer()
{
    return {
        _type: null,
        _paramLength: -1,
        _callback: null,
        _async: false,
        async review(db, config)
        {
            const errors = [];
            const results = [];
            forEach(db, (value, key) =>
            {
                if (!this._type || value.type !== this._type) return;
                if (value.params.length < this._paramLength)
                {
                    errors.push(`Missing required params - expected at least ${this._paramLength} but was ${value.params.length} for '${value.type}': ${key}.`);
                    return;
                }

                if (this._async)
                {
                    results.push(
                        this._callback.call(null, value, key)
                            .catch(e => errors.push(`Failed to review - ${e.message}`))
                    );
                }
                else
                {
                    try
                    {
                        results.push(Promise.resolve(this._callback.call(null, value, key)));
                    }
                    catch(e)
                    {
                        errors.push(`Failed to review '${key}' - ${e.message} - '${value}'`);
                    }
                }
            });

            // Resolve all for each callback promises...
            await Promise.all(results);

            if (errors.length > 0)
            {
                throw errors;
            }
        },
        type(type)
        {
            this._type = type;
            return this;
        },
        paramLength(length)
        {
            this._paramLength = length;
            return this;
        },
        forEach(callback)
        {
            this._callback = callback;
            this._async = false;
            return this;
        },
        forEachAsync(callback)
        {
            this._callback = callback;
            this._async = true;
            return this;
        }
    };
}

function createBuilder()
{
    return {
        _type: null,
        _params: [],
        _paramLength: 0,
        type(type)
        {
            this._type = type;
            return this;
        },
        param(index, type, description, defaultValue = '')
        {
            while (index >= this._params.length)
            {
                this._params.push(undefined);
            }
            
            if (typeof this._params[index] !== 'undefined')
            {
                throw new Error(`Parameter with index ${index} already added for builder.`);
            }

            this._params[index] = {
                type,
                description,
                defaultValue,
            };
            return this;
        },
        async build(id = uuid(), date = new Date(Date.now()))
        {
            const result = await askPrompt(this._type, 'form', {
                choices: this._params.map((value, index) =>
                {
                    return {
                        name: value.type,
                        message: value.type,
                        value: value.type,
                        hint: value.description,
                        initial: String(value.defaultValue),
                    };
                })
            });

            const params = [];
            for(const param of this._params)
            {
                params.push(result[param.type]);
            }

            return createReview(id, date, 'Generated by Progress Auditor', this._type, params);
        }
    };
}

/**
 * Every reviewer is expected to have at least a unique TYPE and a review function.
 * The build function is optional and only if users can change the review.
 */
const TYPE = 'skip_error';
const DESCRIPTION = 'Skip a specific error.';

/**
 * Applies the review to the database.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
async function review(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE)
            .paramLength(1)
            .forEach(value =>
            {
                const { params } = value;
                const errorID = Number(params[0]);
                console.log(`...Skipping error ${errorID} by review...`);
                db.removeErrorByID(errorID);
            })
            .review(db, config);
    }
    catch(e)
    {
        Client.error(e);
        throw e;
    }
}

/**
 * Builds a review instance for the database, interactively.
 * @param {Array<Error>} [errors=[]] The errors this review build is in response to.
 */
async function build(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep(error));
    }
    return result;
}

async function buildStep(error)
{
    return await createBuilder()
        .type(TYPE)
        .param(0, 'Error ID', 'The id of the error to skip.', error.id)
        .build();
}

var SkipErrorReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE,
    DESCRIPTION: DESCRIPTION,
    review: review,
    build: build
});

/**
 * This file is used to abstract away any interactions with the client. This way
 * other files that require client input do not need to worry about proper formatting,
 * style, etc. and just worry about the output data they need.
 * 
 * @module ClientHandler
 */

const chalk$2 = require('chalk');

async function askWhetherDatabaseIsValidToUse(db, config)
{
    // Let the client verify the database stats...
    log('');
    log('== Current Status ==');
    log(` - Current Date: ${config.currentDate}`);
    log(` - Input Path: ${config.inputPath}`);
    log(` - Output Path: ${config.outputPath}`);
    log(` - Scheme: ${config.scheme}`);
    log(` - User(s): ${getUserCount(db)}`);
    log(` - Submission(s): ${getSubmissionCount(db)}`);
    log(` - Review(s): ${getReviewCount(db)}`);
    log('');

    return await ask("Is this correct?");
}

async function askWhetherToIgnoreErrors(db, config, errors)
{
    // Let the client decide whether to skip these errors...
    return await ask(`Do you want to continue despite ${errors.length} error(s)?`);
}

async function askWhetherToSaveNewReviews(db, config, reviews)
{
    // Let the client decide whether to save it...
    return await ask(`Do you want to save the new ${reviews.length} review(s)?`);
}

async function askWhetherToReviewErrors(db, config, errors)
{
    // Let the client decide whether to review the errors...
    error(`Found ${errors.length} errors. :(`, true);
    motivation();
    const result = await ask("Do you want to review them now?", true);
    if (!result)
    {
        log(`Skipping errors...${Math.random() > 0.6 ? chalk$2.gray(`(I trust you)...`) : ''}`);
    }
    return result;
}

async function askWhetherToSaveDebugInfo()
{
    // Let the client decide whether to save debug info (which can contain user info)...
    return await ask(`Do you want to save debug info? It will contain user information.`);
}

async function showSkippingDebugLog()
{
    log('...Skipping debug logs...');
}

async function celebrateNoErrors()
{
    success("== No errors! Hooray! ==");
}

/**
 * This file handles outputting the new review files once the client
 * requests a save. This is used by the ReviewHandler and not specified
 * by the config, as most other outputs are.
 * 
 * @module ReviewOutput
 */

async function output(db, config, outputPath, opts)
{
    const reviewTableHeader = [
        'Review ID',
        'Date',
        'Comment',
        'Type',
        'Param[0]',
        'Param[1]',
        'Param[2]',
        'Param[3]',
        '...'
    ];
    const reviewTable = [reviewTableHeader];

    // Append ALL reviews (including new ones)
    for(const reviewID of getReviews(db))
    {
        const review = getReviewByID(db, reviewID);
        const reviewEntry = [];

        // Don't save skipped errors...
        if (review.type === TYPE) continue;

        // ID
        reviewEntry.push(reviewID);
        // Date
        reviewEntry.push(stringify(review.date));
        // Comment
        reviewEntry.push(review.comment);
        // Type
        reviewEntry.push(review.type);
        // Params
        reviewEntry.push(...review.params);

        // Add to table...
        reviewTable.push(reviewEntry);
    }

    await writeTableToCSV(outputPath, reviewTable);
}

/**
 * This file handles all errors that are thrown and
 * are expected to be resolved by the client. Therefore,
 * these errors should be made FOR resolving, not just
 * to notify the client of an issue.
 * 
 * @module Errors
 */

const ERROR_TAG = 'REVIEW';

function throwSafeError(db, source, message, errorClass = source.id, opts = {})
{
    db.throwError(ERROR_TAG, message, {
        id: [source.id, source.type],
        type: errorClass,
        ...opts
    });
}

function throwInvalidReviewParamSubmissionIDError(db, source, submissionID)
{
    return throwSafeError(
        db,
        source,
        `Invalid review param - unable to find submission for id '${submissionID}'.`,
        'review_param_submission_id',
        {
            options: [
                'The submission for that id is missing from the database.',
                `Or the id is wrong. Try fixing the review file or ignore the review.`
            ],
            context: {
                // Used by ignore_review
                reviewID: source.id,
                // Used by... nobody yet
                submissionID,
            }
        }
    );
}

function throwInvalidReviewParamUserIDError(db, source, userID)
{
    return throwSafeError(
        db,
        source,
        `Invalid review param - Cannot find user for id '${userID}'.`,
        'review_param_user_id',
        {
            options: [
                `User with this id is missing from the database.`,
                `Or the id is wrong.`
            ],
            context: {
                // Used by ignore_review
                reviewID: source.id,
                // Used by... nobody yet
                userID,
            }
        }
    );
}

function throwInvalidReviewParamOwnerKeyError(db, source, ownerKey)
{
    return throwSafeError(
        db,
        source,
        `Invalid review param - Cannot find user for owner key '${ownerKey}'.`,
        'review_param_owner_key',
        {
            options: [
                `Add missing owner key to a user.`
            ],
            context: {
                // Used by ignore_review
                reviewID: source.id,
                // Used by add_owner_key, ignore_owner
                ownerKey,
            }
        }
    );
}

function throwInvalidReviewParamAssignmentIDError(db, source, assignmentID)
{
    return throwSafeError(
        db,
        source,
        `Invalid review param - Cannot find assignment for id '${assignmentID}'.`,
        'review_param_assignment_id',
        {
            options: [
                `User may not be assigned this assignment.`,
                `Assignment id may not exist.`
            ],
            context: {
                // Used by ignore_review
                reviewID: source.id,
                // Used by...nobody
                assignmentID,
            }
        }
    );
}

function throwUnassignedSubmissionError(db, source, userID, assignmentID, submission)
{
    return throwSafeError(
        db,
        source,
        `Found unassigned submission '${submission.id}' for assignment '${assignmentID}' from user '${userID}'.`,
        'unassigned_submission',
        {
            info: submission.attributes.content.head,
            options: [
                `The submission header could be ill-formatted. We could not deduce its appropriate assignment automatically. Please verify the submitted content and header formats. Try submitting a 'change_assignment' review once you figure out its proper assignment.`,
                `It could be a non-assignment submission. Try submitting a 'ignore_submission' review.`
            ],
            more: [
                JSON.stringify(submission, null, 4)
            ],
            context: {
                // Used by ignore_submission, change_assignment
                submissionID: submission.id,
            }
        }
    );
}

function throwUnownedSubmissionError(db, source, ownerKey, submissions)
{
    let submissionCount = 0;
    for(const assignmentID of Object.keys(submissions))
    {
        submissionCount += submissions[assignmentID].length;
    }
    
    return throwSafeError(
        db,
        source,
        `Found ${submissionCount} unowned submissions - cannot find user for owner key '${ownerKey}'.`,
        'unowned_submission',
        {
            options: [
                `There are submissions without a valid user associated with it. Perhaps someone is using a different owner key? Try submitting a 'add_owner' review once you've found who these submissions belong to.`,
                `The owner key may be ill-formatted. Instead of fixing the mispelling, try submitting a 'add_owner' review to associate it back to the user.`
            ],
            more: [
                JSON.stringify(submissions, null, 4)
            ],
            context: {
                // Used by add_owner_key
                ownerKey: ownerKey,
            }
        }
    );
}

const ERROR_TAG$1 = 'REVIEW';

const SUBMISSION_TYPE_UNKNOWN = 'unknown';
const SUBMISSION_TYPE_SOURCE = 'source';
const SUBMISSION_TYPE_MINOR_EDIT = 'minor';
const SUBMISSION_TYPE_MAJOR_EDIT = 'major';

const TYPE$1 = 'assignment_by_header';
const DESCRIPTION$1 = 'Assigns submission by matching post headers.';

/**
 * Searches through all submissions and assigns them to the appropriate assignment.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
async function review$1(db, config)
{
    try
    {
        for(const ownerKey of getOwners(db))
        {
            const userID = getUserByOwnerKey(db, ownerKey);
            if (userID)
            {
                // Found owner -> user match! Now resolve post type...
                const submittedAssignments = getAssignedSubmissionsByOwnerKey(db, ownerKey);
                for(const assignmentID of Object.keys(submittedAssignments))
                {
                    // Submissions are guaranteed to be in-order by time. The most recent entry being the last.
                    const submissions = submittedAssignments[assignmentID];
                    
                    const ownedAssignment = getAssignmentByID(db, userID, assignmentID);
                    if (ownedAssignment)
                    {
                        const dueDate = ownedAssignment.dueDate;
                        // TODO: baseSubmission will change if there are reviews. That would mean the new reviewed will be the base.
                        const baseSubmission = getNearestSubmission(submissions, dueDate);
                        const nextSubmission = submissions[submissions.length - 1];
                        const postType = evaluatePostType(nextSubmission, baseSubmission);
        
                        // TODO: Always review major post edits. There is a post edit only if PAST the due date. Otherwise, it would be the new source.
                        // TODO: Should NOT ALWAYS pick the earliest one.
                        setGradedSubmissionForAssignment(db, userID, assignmentID, baseSubmission);
                        /*
                        if (postType === 'major')
                        {
                            setGradedSubmissionForAssignment(db, userID, assignmentID, nextSubmission);
                        }
                        else if (postType === 'source' || postType === 'minor')
                        {
                            setGradedSubmissionForAssignment(db, userID, assignmentID, baseSubmission);
                        }
                        else
                        {
                            db.throwError('[UNKNOWN_SUBMISSION_TYPE]\t', 'Unknown submission type - cannot evaluate edited post -', postType, '- DUE:', dueDate);
                            db.throwError('\t\t\t\t\t\t\t\tSubmission:', baseSubmission, '\n=-=-=-=-=-=>\n', nextSubmission);
                        }
                        */
                    }
                    else
                    {
                        for(const submission of submissions)
                        {
                            throwUnassignedSubmissionError(db, { id: userID + ':' + assignmentID, type: TYPE$1 }, userID, assignmentID, submission);
                        }
                    }
                }
            }
            else
            {
                const submissions = getAssignedSubmissionsByOwnerKey(db, ownerKey);
                throwUnownedSubmissionError(db, { id: ownerKey, type: TYPE$1 }, ownerKey, submissions);
            }
        }
    }
    catch(e)
    {
        db.throwError(ERROR_TAG$1, e);
    }
}

// No build mode for this review...
const build$1 = undefined;

function evaluatePostType(submission, baseSubmission)
{
    if (submission === baseSubmission) return SUBMISSION_TYPE_SOURCE;
    // There are posts that have the same content, but different times. They are treated as minor edits;
    if (submission.attributes.content.body == baseSubmission.attributes.content.body) return SUBMISSION_TYPE_MINOR_EDIT;
    if (submission.attributes.content.body != baseSubmission.attributes.content.body) return SUBMISSION_TYPE_MAJOR_EDIT;

    // TODO: This will never be reached, but once we have a tolerance function for the body content compare, it will.
    if (submission.attributes.content.head != baseSubmission.attributes.content.head) return SUBMISSION_TYPE_MINOR_EDIT;
    return SUBMISSION_TYPE_UNKNOWN;
}

function setGradedSubmissionForAssignment(db, userID, assignmentID, submission)
{
    const assignment = getAssignmentByID(db, userID, assignmentID);
    assignment.attributes.submission = submission;
}

function getNearestSubmission(submissions, targetDate)
{
    let minSubmission = null;
    let minDateOffset = Infinity;
    for(const submission of submissions)
    {
        const dateOffset = compareDates(submission.date, targetDate);

        // If there exists a submission BEFORE the due date, return that one.
        if (minSubmission && dateOffset > 0)
        {
            return minSubmission;
        }

        // Otherwise...
        if (Math.abs(dateOffset) < minDateOffset)
        {
            minSubmission = submission;
            minDateOffset = Math.abs(dateOffset);
        }
    }
    return minSubmission;
}

var SubmissionAssignmentByHeaderReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$1,
    DESCRIPTION: DESCRIPTION$1,
    review: review$1,
    build: build$1
});

const ERROR_TAG$2 = 'REVIEW';

const TYPE$2 = 'assignment_by_intro';
const DESCRIPTION$2 = 'Assigns submission by matching intro headers.';

/**
 * Searches all unassigned submissions to check if they could also be 'intro' assignments.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
async function review$2(db, config)
{
    try
    {
        for(const ownerKey of getOwners(db))
        {
            const userID = getUserByOwnerKey(db, ownerKey);
            if (userID)
            {
                const userName = getUserByID(db, userID).name;
        
                const assignedSubmissions = getAssignedSubmissionsByOwnerKey(db, ownerKey);
                if ('null' in assignedSubmissions)
                {
                    const unassignedSubmissions = assignedSubmissions['null'].slice();
                    for(const unassignedSubmission of unassignedSubmissions)
                    {
                        if (unassignedSubmission.attributes.content.head.trim() === userName)
                        {
                            changeSubmissionAssignment(db, unassignedSubmission, 'intro');
                        }
                    }
                }
            }
        }
    }
    catch(e)
    {
        db.throwError(ERROR_TAG$2, e);
    }
}

// No build mode for this review...
const build$2 = undefined;

var SubmissionAssignmentByIntroReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$2,
    DESCRIPTION: DESCRIPTION$2,
    review: review$2,
    build: build$2
});

const ERROR_TAG$3 = 'REVIEW';

const TYPE$3 = 'assignment_by_last';
const DESCRIPTION$3 = 'Assigns submission by matching last week assignment number.';

const WEEK_PATTERN = /week\[([0-9]+)\]/i;

/**
 * Searches all 'week[n]' submissions (where n is the last week's assignment number) to check if they could also be 'last' assignments.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
async function review$3(db, config)
{
    try
    {
        for(const ownerKey of getOwners(db))
        {
            const userID = getUserByOwnerKey(db, ownerKey);
            if (userID)
            {
                // Find the last week's assignment number...
                const assignments = getAssignmentsByUser(db, userID);
                let maxAssignmentNumber = 0;
                for(const assignmentID of assignments)
                {
                    const result = WEEK_PATTERN.exec(assignmentID);
                    if (result && result.length >= 2)
                    {
                        try
                        {
                            const assignmentNumber = Number.parseInt(result[1]);
                            if (assignmentNumber > maxAssignmentNumber)
                            {
                                maxAssignmentNumber = assignmentNumber;
                            }
                        }
                        catch(e)
                        {
                            // Ignore it.
                        }
                    }
                }
                const lastWeekNumber = maxAssignmentNumber + 1;
        
                const assignedSubmissions = getAssignedSubmissionsByOwnerKey(db, ownerKey);
                const key = `week[${lastWeekNumber}]`;
                if (key in assignedSubmissions)
                {
                    const unassignedSubmissions = assignedSubmissions[key].slice();
                    for(const unassignedSubmission of unassignedSubmissions)
                    {
                        changeSubmissionAssignment(db, unassignedSubmission, 'last');
                    }
                }
            }
        }
    }
    catch(e)
    {
        db.throwError(ERROR_TAG$3, e);
    }
}

// No build mode for this review...
const build$3 = undefined;

var SubmissionAssignmentByLastReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$3,
    DESCRIPTION: DESCRIPTION$3,
    review: review$3,
    build: build$3
});

const TYPE$4 = 'assignment_by_post';
const DESCRIPTION$4 = 'Assigns submission by matching post id.';

/**
 * Searches through all submissions and tries to assign them by post id.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
async function review$4(db, config)
{
    try
    {
        for(const submissionID of getSubmissions(db))
        {
            const submission = getSubmissionByID(db, submissionID);
            const userID = getUserByOwnerKey(db, submission.owner);
            // Skip any unknown owner keys. It is not my job.
            if (!userID) continue;
            const validAssignments = getAssignmentsByUser(db, userID);

            // If this submission is not assigned correctly (not only unassigned)...
            if (!validAssignments.includes(submission.assignment))
            {
                const unassignedSubmission = submission;

                let resolved = false;
                const ownerKey = unassignedSubmission.owner;
                const assignedSubmissions = getAssignedSubmissionsByOwnerKey(db, ownerKey);
                for(const [assignmentID, submissions] of Object.entries(assignedSubmissions))
                {
                    // If it is a properly assigned assignment...
                    if (!validAssignments.includes(assignmentID)) continue;

                    for(const ownedSubmission of submissions)
                    {
                        // And it has the same post id as the unassigned one...
                        if (unassignedSubmission.attributes.content.id === ownedSubmission.attributes.content.id)
                        {
                            // It should be of the same assignment :D
                            changeSubmissionAssignment(db, unassignedSubmission, ownedSubmission.assignment);
                            resolved = true;
                        }

                        if (resolved) break;
                    }
                    if (resolved) break;
                }
            }
        }
    }
    catch(e)
    {
        error(e);
        throw e;
    }
}

// No build mode for this review...
const build$4 = undefined;

var SubmissionAssignmentByPostNumberReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$4,
    DESCRIPTION: DESCRIPTION$4,
    review: review$4,
    build: build$4
});

const ERROR_TAG$4 = 'REVIEW';

/**
 * This is the LAST time zone offset from UTC. This means that there does
 * not exist any other place on Earth with an earlier time, therefore the due
 * date MUST be passed for everyone.
 */
const LATEST_TIMEZONE_OFFSET = 12 * 3600000;

const TYPE$5 = 'submission_slip_days';
const DESCRIPTION$5 = 'Calculates the number of slip days for assigned submissions.';

/**
 * Calculates the slip days for each user and assignment. This depends on submission
 * already being assigned appropriately.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
async function review$5(db, config)
{
    try
    {
        // HACK: There should be a better way to get today's date.
        const currentDate = db.currentDate;
    
        // Dependent on accurate assignment resolution for submissions...
        for(const userID of getUsers(db))
        {
            // Progress calculations
            let missing = 0;
            let unassigned = 0;
            let submitted = 0;
    
            // Slip calculations
            const submittedSlips = [];
            let totalSlips = 0;
            let daySlips = 0;
            const user = getUserByID(db, userID);
            const schedule = user.schedule;
            const maxSlips = schedule.weeks * 3;
            const assignments = getAssignmentsByUser(db, userID);
    
            for(const assignmentID of assignments)
            {
                const assignment = getAssignmentByID(db, userID, assignmentID);
    
                // Check if not yet processed... (sometimes already processed by review)
                if (!('status' in assignment.attributes) || !('slip' in assignment.attributes))
                {
                    const dueDate = assignment.dueDate;
                    if (compareDates(currentDate, dueDate) < 0)
                    {
                        assignment.attributes.status = '_';
                        assignment.attributes.slipDays = 0;
                    }
                    else
                    {
                        let submitDate;
                        if (assignment.attributes.submission)
                        {
                            assignment.attributes.status = 'Y';
                            submitDate = assignment.attributes.submission.date;
                        }
                        else
                        {
                            assignment.attributes.status = 'N';
                            submitDate = currentDate;
                        }
    
                        const slipDays = calculateSlipDays(submitDate, dueDate);
                        assignment.attributes.slipDays = slipDays;
                    }
                }
    
                // Update assignment info...
                const slipDays = assignment.attributes.slipDays;
                if (slipDays > 0)
                {
                    submittedSlips.push(slipDays);
                    totalSlips += slipDays;
                    ++daySlips;
                }
    
                switch(assignment.attributes.status)
                {
                    case 'Y': ++submitted; break;
                    case 'N': ++missing; break;
                    case '_': ++unassigned; break;
                    // Don't recognize the status...
                    default: ++unassigned;
                }
            }
    
            let mean = 0;
            let median = 0;
            if (daySlips > 0)
            {
                // Calculate mean...
                mean = totalSlips / daySlips;
                
                // Calculate median...
                if (submittedSlips.length % 2 === 0)
                {
                    const left = Math.floor(submittedSlips.length / 2);
                    const right = left + 1;
                    median = left + right / 2;
                }
                else
                {
                    median = Math.floor(submittedSlips.length / 2);
                }
            }
    
            user.attributes.slips = {
                used: totalSlips,
                remaining: maxSlips - totalSlips,
                max: maxSlips,
                mean,
                median,
            };
            
            user.attributes.progress = {
                submitted,
                missing,
                unassigned,
            };
        }
    }
    catch(e)
    {
        db.throwError(ERROR_TAG$4, e);
    }
}

// No build mode for this review...
const build$5 = undefined;

/**
 * Calculates the number of days past the submission, accounting for time zones and partial days.
 * @param {Date} submitDate The date submitted.
 * @param {Date} dueDate The date the something should have been due.
 * @returns {Number} The number of days past the due date from submission. Otherwise, it is 0.
 */
function calculateSlipDays(submitDate, dueDate)
{
    const days = Math.floor((dueDate.getTime() + LATEST_TIMEZONE_OFFSET) / ONE_DAYTIME) - Math.floor(submitDate.getTime() / ONE_DAYTIME);
    if (days < 0)
    {
        return -days;
    }
    else
    {
        return 0;
    }
}

var SubmissionSlipDaysReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$5,
    DESCRIPTION: DESCRIPTION$5,
    review: review$5,
    build: build$5
});

const TYPE$6 = 'change_assignment_status';
const DESCRIPTION$6 = 'Changes the assignment status and slips for an owner.';

async function review$6(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE$6)
            .paramLength(3)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const ownerKey = params[0];
                const userID = UserDatabase.getUserByOwnerKey(db, ownerKey);
                if (!userID)
                {
                    throwInvalidReviewParamOwnerKeyError(db, value, ownerKey);
                    return;
                }
            
                const assignmentID = params[1];
                const status = params[2];
            
                const slipDays = params.length > 3 ? Number(params[3]) : 0;
                const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
                if (!assignment) {
                    throwInvalidReviewParamAssignmentIDError(db, value, assignmentID);
                    return;
                }
            
                assignment.attributes.status = status;
                assignment.attributes.slipDays = slipDays;
            })
            .review(db, config);
    }
    catch(e)
    {
        Client.error(e);
        throw e;
    }
}

async function build$6(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep$1());
    }
    return result;
}

async function buildStep$1(error)
{
    return await createBuilder()
        .type(TYPE$6)
        .param(0, 'Owner Key', 'The target owner with the target assignment')
        .param(1, 'Assignment ID', 'The target assignment ID')
        .param(2, 'Status', 'The new status for the assignment')
        .param(3, '[Slip Days]', 'An optional parameter for the number of new slips days.')
        .build();
}

var AssignmentChangeStatusReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$6,
    DESCRIPTION: DESCRIPTION$6,
    review: review$6,
    build: build$6
});

const TYPE$7 = 'add_submission';
const DESCRIPTION$7 = 'Add submission (with assignment) for owner.';

async function review$7(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE$7)
            .paramLength(2)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const ownerKey = params[0];
                const userID = getUserByOwnerKey(db, ownerKey);
                if (!userID)
                {
                    throwInvalidReviewParamOwnerKeyError(db, value, ownerKey);
                    return;
                }
                
                const assignmentID = params[1];
                const submissionID = ownerKey + '#proxy_' + stringHash(`${id}:${ownerKey}.${assignmentID}`);
                const submissionDate = params.length >= 2
                    ? parse(params[2])
                    : new Date(getAssignmentByID(db, userID, assignmentID).dueDate.getTime() - 1);
                const submissionAttributes = params.length >= 3
                    ? JSON.parse(params[3])
                    : {};
                
                if (getSubmissionByID(db, submissionID))
                {
                    console.log("...Ignoring dupliate reviewed submission...");
                    return;
                }

                addSubmission(db, submissionID, ownerKey, assignmentID, submissionDate, submissionAttributes);
            })
            .review(db, config);
    }
    catch(e)
    {
        Client.error(e);
        throw e;
    }
}

async function build$7(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep$2());
    }
    return result;
}

async function buildStep$2(error)
{
    return await createBuilder()
        .type(TYPE$7)
        .param(0, 'Owner Key', 'The target owner to add the submission for.')
        .param(1, 'Assignment ID', 'The submission\'s assignment ID.')
        .param(2, '[Submission Date]', 'An optional parameter for the date of the new submission.')
        .param(3, '[Submission Attributes]', 'An optional parameter object for additional attributes.')
        .build();
}

var SubmissionAddReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$7,
    DESCRIPTION: DESCRIPTION$7,
    review: review$7,
    build: build$7
});

const TYPE$8 = 'change_assignment';
const DESCRIPTION$8 = 'Change assignment for submission.';

async function review$8(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE$8)
            .paramLength(2)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const submission = getSubmissionByID(db, params[1]);
                if (!submission)
                {
                    throwInvalidReviewParamSubmissionIDError(db, value, params[1]);
                    return;
                }

                changeSubmissionAssignment(db, submission, params[0]);
            })
            .review(db, config);
    }
    catch(e)
    {
        error(e);
        throw e;
    }
}

async function build$8(errors, db, config)
{
    // Batch error processing...
    if (errors.length > 1)
    {
        const cache = db.getCache();
        const assignmentKeys = cache.assignmentKeys ? Array.from(cache.assignmentKeys) : [];
        let assignmentID = await askChoose('What is the expected assignment ID instead?', [...assignmentKeys, '(custom)']);
        if (assignmentID === '(custom)')
        {
            assignmentID = await askPrompt('What is the custom assignment ID?', 'input');
        }

        const result = [];
        for(const error of errors)
        {
            const id = uuid();
            const date = new Date(Date.now());
            const params = [assignmentID, error.context.submissionID];
            result.push(createReview(id, date, 'Generated by Progress Auditor', TYPE$8, params));
        }
        return result;
    }
    // Single error processing...
    else
    {
        const result = [];
        for(const error of errors)
        {
            const review = await buildStep$3(error);
            result.push(review);
        }
        return result;
    }
}

async function buildStep$3(error)
{
    return await createBuilder()
        .type(TYPE$8)
        .param(0, 'Assignment ID', 'The new assignment id to change to.')
        .param(1, 'Submission ID', 'The id for the target submission.', error.context.submissionID || '')
        .build();
}

var SubmissionChangeAssignmentReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$8,
    DESCRIPTION: DESCRIPTION$8,
    review: review$8,
    build: build$8
});

const TYPE$9 = 'change_submission_date';
const DESCRIPTION$9 = 'Change date for submission.';

async function review$9(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE$9)
            .paramLength(2)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const submission = getSubmissionByID(db, params[0]);
                if (!submission)
                {
                    throwInvalidReviewParamSubmissionIDError(db, value, params[0]);
                    return;
                }
            
                submission.date = parse(params[1]);
            })
            .review(db, config);
    }
    catch(e)
    {
        Client.error(e);
        throw e;
    }
}

async function build$9(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep$4());
    }
    return result;
}

async function buildStep$4(error)
{
    return await createBuilder()
        .type(TYPE$9)
        .param(0, 'Submission ID', 'The target submission to change.')
        .param(1, 'Submission Date', 'The target date to change to.')
        .build();
}

var SubmissionChangeDateReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$9,
    DESCRIPTION: DESCRIPTION$9,
    review: review$9,
    build: build$9
});

const TYPE$a = 'ignore_owner';
const DESCRIPTION$a = 'Ignore all submissions for owner.';

async function review$a(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE$a)
            .paramLength(1)
            .forEach(value =>
            {
                const { params } = value;
                clearSubmissionsByOwner(db, params[0]);
            })
            .review(db, config);
    }
    catch(e)
    {
        Client.error(e);
        throw e;
    }
}

async function build$a(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep$5(error));
    }
    return result;
}

async function buildStep$5(error)
{
    return await createBuilder()
        .type(TYPE$a)
        .param(0, 'Owner Key', 'The target owner to ignore.', error.context.ownerKey || '')
        .build();
}

var SubmissionIgnoreOwnerReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$a,
    DESCRIPTION: DESCRIPTION$a,
    review: review$a,
    build: build$a
});

const TYPE$b = 'ignore_submission';
const DESCRIPTION$b = 'Ignore specific submission by id.';

async function review$b(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE$b)
            .paramLength(1)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const targetSubmission = getSubmissionByID(db, params[0]);
                if (!targetSubmission)
                {
                    console.log("...Ignoring redundant review for missing submission...");
                    return;
                }

                const deleteSubmisssionIDs = [];
                for(const submissionID of getSubmissions(db))
                {
                    const submission = getSubmissionByID(db, submissionID);
                    if (submission.owner == targetSubmission.owner
                        && submission.attributes.content.id == targetSubmission.attributes.content.id)
                    {
                        deleteSubmisssionIDs.push(submissionID);
                    }
                }

                for(const submissionID of deleteSubmisssionIDs)
                {
                    removeSubmissionByID(db, submissionID);
                }
            })
            .review(db, config);
    }
    catch(e)
    {
        Client.error(e);
        throw e;
    }
}

async function build$b(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep$6(error));
    }
    return result;
}

async function buildStep$6(error)
{
    return await createBuilder()
        .type(TYPE$b)
        .param(0, 'Submission ID', 'The target submission id.', error.context.submissionID || '')
        .build();
}

var SubmissionIgnoreReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$b,
    DESCRIPTION: DESCRIPTION$b,
    review: review$b,
    build: build$b
});

const TYPE$c = 'add_owner_key';
const DESCRIPTION$c = 'Add additional owner key for user.';

async function review$c(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE$c)
            .paramLength(2)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const user = getUserByID(db, params[0]);
                if (!user)
                {
                    throwInvalidReviewParamUserIDError(db, value, params[0]);
                    return;
                }
            
                const ownerKey = params[1];
                if (user.ownerKey.includes(ownerKey))
                {
                    console.log("...Ignoring redundant review for owner key...");
                    return;
                }
            
                if (Array.isArray(user.ownerKey))
                {
                    user.ownerKey.push(ownerKey);
                }
                else
                {
                    user.ownerKey = [user.ownerKey, ownerKey];
                }
            })
            .review(db, config);
    }
    catch(e)
    {
        error(e);
        throw e;
    }
}

async function build$c(errors, db, config)
{
    if (errors.length > 1)
    {
        const userIDs = getUsers(db);
        const choices = [];
        for(const userID of userIDs)
        {
            choices.push({
                message: userID + ': ' + chalk$1.gray(getUserByID(db, userID).name),
                value: userID,
            });
        }
        choices.push('(custom)');
        const userID = await askChoose('What is the expected user ID instead?', choices);
        if (userID === '(custom)')
        {
            userID = await askPrompt('What is the custom user ID?', 'input');
        }

        const result = [];
        for(const error of errors)
        {
            const id = uuid();
            const date = new Date(Date.now());
            const params = [userID, error.context.ownerKey];
            result.push(createReview(id, date, 'Generated by Progress Auditor', TYPE$c, params));
        }
        return result;
    }
    else
    {
        const result = [];
        for(const error of errors)
        {
            result.push(await buildStep$7(error));
        }
        return result;
    }
}

async function buildStep$7(error)
{
    return await createBuilder()
        .type(TYPE$c)
        .param(0, 'User ID', 'The target user id to add the owner for.')
        .param(1, 'Owner Key', 'The new owner key to add for the user.', error.context.ownerKey || '')
        .build();
}

var UserAddOwnerReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$c,
    DESCRIPTION: DESCRIPTION$c,
    review: review$c,
    build: build$c
});

const ERROR_TAG$5 = 'REVIEW';

const TYPE$d = 'null';
const DESCRIPTION$d = 'Unknown review type.';

async function review$d(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE$d)
            .forEach(value =>
            {
                const { id, type } = value;
                db.throwError(ERROR_TAG$5, `Unhandled review type ${type} for review '${id}'.`, {
                    id: [id, type],
                    options: [
                        `You probably misspelled the review type.`,
                        `Ask the developer to handle a new '${type}' review type.`
                    ]
                });
            })
            .review(db, config);
    }
    catch(e)
    {
        Client.error(e);
        throw e;
    }
}

const build$d = undefined;

var NullReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$d,
    DESCRIPTION: DESCRIPTION$d,
    review: review$d,
    build: build$d
});

/**
 * Every reviewer is expected to have at least a unique TYPE and a review function.
 * The build function is optional and only if users can change the review.
 */
const TYPE$e = 'empty';
const DESCRIPTION$e = 'A placeholder review if you need one.';

/**
 * Applies the review to the database.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
async function review$e(db, config)
{
    // console.log("Nice to meet you. I'm empty :D");
}

/**
 * Builds a review instance for the database, interactively.
 * @param {Array<Error>} [errors=[]] The errors (of the same error type) this review build is in response to.
 */
async function build$e(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep$8());
    }
    return result;
}

async function buildStep$8(error)
{
    // console.log("Just a placeholder, if you need it.");
    return await createBuilder()
        .type(TYPE$e)
        .param(0, 'Comment', 'Anything you want to say about this placeholder.')
        .build();
}

var EmptyReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$e,
    DESCRIPTION: DESCRIPTION$e,
    review: review$e,
    build: build$e
});

const TYPE$f = 'ignore_review';
const DESCRIPTION$f = 'Ignore another review (cannot ignore another ignore_review).';

const IGNORE_SUFFIX = '#IGNORE';

/**
 * This is a reflection review, as in it reviews (action) reviews (object).
 * Therefore, it must run first. Please refer to VacationReview for specifics.
 */
async function review$f(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE$f)
            .paramLength(1)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const reviewID = params[0];
                const review = getReviewByID(db, reviewID);
                if (review.type.endsWith(IGNORE_SUFFIX)) return;
                if (review.type === TYPE$f)
                {
                    throw new Error(`Invalid review target '${reviewID}' - cannot ignore another ignore_review type.`);
                }
                // NOTE: We should not REMOVE the old review, just in case we want to refer to it later.
                // This is important because, if removed, the old review will no longer be saved to file.
                // So just change the type instead.
                // ReviewDatabase.removeReviewByID(db, reviewID);
                review.type = review.type + IGNORE_SUFFIX;
            })
            .review(db, config);
    }
    catch(e)
    {
        Client.error(e);
        throw e;
    }
}

async function build$f(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep$9(error));
    }
    return result;
}

async function buildStep$9(error)
{
    return await createBuilder()
        .type(TYPE$f)
        .param(0, 'Review ID', 'The target review to ignore.', error.context.reviewID || '')
        .build();
}

var IgnoreReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$f,
    DESCRIPTION: DESCRIPTION$f,
    review: review$f,
    build: build$f
});

const TYPE$g = 'add_vacation';
const DESCRIPTION$g = 'Add a vacation to the user\'s schedule';

/**
 * Although this is not a "reflection" review, it does require to be BEFORE assignment data loading.
 * Since data loading is processed BEFORE all reviews, it makes it first. This causes issues with
 * other reflection reviews, therefore all reflection reviews are also processed here.
 */
async function review$g(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE$g)
            .paramLength(3)
            .forEach(value =>
            {
                // NOTE: Because VacationReview is EXPECTED to be called
                // BEFORE all other reviews and any reviews that need "reflection"
                // must run first, those reviews must be applied in 2 places:
                // - Before all the other review types
                // - And during VacationReview
                
                const { id, params } = value;

                // NOTE: So far, only IgnoreReview requires this.
                let ignore = false;
                for(const reviewID of getReviews(db))
                {
                    const review = getReviewByID(db, reviewID);
                    if (review.type === TYPE$f && review.params.length >= 1 && review.params[0] == id)
                    {
                        // This vacation review is ignored.
                        ignore = true;
                        break;
                    }
                }
                if (ignore) return;

                // Back to your regularly scheduled program...
                const ownerKey = parseEmail(params[0]);
                const startDate = parse(params[1]);
                const endDate = parse(params[2]);

                let vacationID;
                if (params.length > 3)
                {
                    vacationID = params[3];
                }
                else
                {
                    vacationID = stringHash(params.join('|'));
                }
    
                // TODO: Vacation padding should be specified at top level or by assignment
                addVacation(db, vacationID, ownerKey, startDate, endDate, 'week');
            })
            .review(db, config);
    }
    catch(e)
    {
        Client.error(e);
        throw e;
    }
}

async function build$g(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep$a());
    }
    return result;
}

async function buildStep$a(error)
{
    return await createBuilder()
        .type(TYPE$g)
        .param(0, 'Owner Key', 'The target owner to have the vacation.')
        .param(1, 'Start Date', 'The start date of the vacation.')
        .param(2, 'End Date', 'The end date of the vacation.')
        .param(3, '[Vacation ID]', 'The globally-unique id for the vacation. By default, this will be auto-generated.')
        .build();
}

var VacationReview = /*#__PURE__*/Object.freeze({
    TYPE: TYPE$g,
    DESCRIPTION: DESCRIPTION$g,
    review: review$g,
    build: build$g
});

async function setup(db, config, reviewRegistry)
{
    reviewRegistry
        // NOTE: Must be first. (however, this won't apply for vacation reviews, look at VacationReview for solution)
        .register(IgnoreReview)
        // NOTE: The 2nd argument is an execution override. We don't want it to execute normally.
        .register(VacationReview, true)
        .register(SkipErrorReview, true)
        // NOTE: Order determines execution order, but these
        // reviews shouldn't care about that.
        .register(NullReview)
        .register(EmptyReview)
        .register(UserAddOwnerReview)
        .register(SubmissionChangeAssignmentReview)
        .register(SubmissionChangeDateReview)
        .register(SubmissionIgnoreOwnerReview)
        .register(SubmissionIgnoreReview)
        .register(SubmissionAddReview)
        .register(AssignmentChangeStatusReview);
    
    // NOTE: VacationReview is handled externally at data population by DatabaseHandler.
    // This is due to a dependency that we cannot get rid of if we want
    // vacation data to live inside the review file.
}

const SCHEME_NAME = 'piazza';

async function setup$1(db, config, reviewRegistry)
{
    await setup(db, config, reviewRegistry);
    
    reviewRegistry
        // Order matters here...
        .register(SubmissionAssignmentByIntroReview)
        .register(SubmissionAssignmentByLastReview)
        // This must go after all assignment resolution reviews.
        .register(SubmissionAssignmentByPostNumberReview)
        // This ASSIGNS ALL OTHER submissions.
        .register(SubmissionAssignmentByHeaderReview)
        // This must go LAST.
        .register(SubmissionSlipDaysReview);
}

async function prepareDatabaseForScheme(db, config, schemeName = config.scheme)
{
    if (!schemeName) throw new Error('Missing \'scheme\' from config.');
    switch(schemeName)
    {
        case SCHEME_NAME:
            await setup$1(db, config, INSTANCE);
            break;
        default:
            throw new Error(`Unknown scheme by name '${schemeName}'.`);
    }
}

function getSchemeNames()
{
    return [
        SCHEME_NAME
    ];
}

async function populateDatabaseWithAdditionalReviews(db, config, reviews)
{
    for(const review of reviews)
    {
        const { id, date, comment, type, params } = review;
        addReview(db, id, date, comment, type, params);
    }
}

/** This is used, alongside DatabaseHandler.populateDatabaseWithInputs(), in both the input and validation stage. */
async function fixDatabaseWithReviews(db, config)
{
    console.log('...Reviewing our work...');
    await INSTANCE.applyReviews(db, config, db[REVIEW_KEY]);
    
    // NOTE: This needs to be ALWAYS applied last, because errors can be generated
    // from other reviews. This let's you skip them.
    await review(db, config, db[REVIEW_KEY]);
}

async function shouldSaveReviewsForClient(db, config, reviews)
{
    if (!reviews || reviews.length <= 0) return false;

    const result = await askWhetherToSaveNewReviews(db, config, reviews);
    if (!result)
    {
        console.log('...Dumping reviews...');
    }
    return result;
}

/**
 * Writes all current database reviews to file.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
async function outputReviewsToFile(db, config)
{
    const path = require('path');
    let outputFilePath;
    if (config.outputAutoDate && db)
    {
        outputFilePath = path.resolve(config.outputPath + '/' + stringify(db.currentDate, false), 'reviews.csv');
    }
    else
    {
        outputFilePath = path.resolve(config.outputPath, `reviews-${stringify(new Date(Date.now()), true)}.csv`);
    }
    
    await output(db, config, outputFilePath);
}

// TODO: not used yet.
const PARSER_OPTIONS = {
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
async function parse$1(db, config, filepath, opts={ maxEndDates: [] })
{
    setupDatabase$1(db);

    const maxEndDateEntries = processMaxEndDateEntries(opts.maxEndDates);

    let first = true;
    await readCSVFileByRow(filepath, (row) => {
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
            const userID = row[5].trim().toUpperCase(); // FieldParser.parseEmail(row[6]);
            const ownerKey = parseEmail(row[6], row[1]);
            const userName = parseName(`${row[3]} ${row[2]}`);
            const pid = row[5].trim().toUpperCase();
            const startDate = parseAmericanDate(row[11]);
            const endDate = parseAmericanDate(row[12]);

            // Max end date option...
            const enrollmentQuarter = row[9];
            for(const maxEndDateEntry of maxEndDateEntries)
            {
                if (maxEndDateEntry.pattern.test(enrollmentQuarter))
                {
                    if (compareDates(endDate, maxEndDateEntry.endDate) > 0)
                    {
                        endDate.setTime(maxEndDateEntry.endDate.getTime());
                    }
                }
            }
            const user = addUser(db, userID, ownerKey, userName, startDate, endDate, opts, { pid });
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
            endDate: parse(maxEndDate.endDate),
        });
    }
    return result;
}

var CohortParser = /*#__PURE__*/Object.freeze({
    PARSER_OPTIONS: PARSER_OPTIONS,
    parse: parse$1
});

function evaluatePostAssignment(headerContent, bodyContent)
{
    // Intro Assignment
    {
        if (/intro/i.test(headerContent))
        {
            return 'intro';
        }
    }
    // Weekly Assignment
    {
        const pattern = /week ?([0-9]+)/i;
        const result = pattern.exec(headerContent);
        if (result && result.length > 0)
        {
            if (result[1] == '0')
            {
                return 'intro';
            }
            else
            {
                return 'week[' + Number.parseInt(result[1]) + ']';
            }
        }
    }
    // Last Assignment
    {
        if (/last/i.test(headerContent) || /final/i.test(headerContent))
        {
            return 'last';
        }
    }
    
    return 'null';
}

/*
How to resolve reports?

If the formula succeeds for the user, then generate a report for the user.
*/

/*
How to resolve vacations?

Result:
- Any submission already reviewed to be ON-HOLD due to vacation should be SHOWN each run.
- All later due dates should shift (if able) by the vacation length.
- Vacations can be indefinite.
- There can be multiple vacations.

Solution:
That means that vacations must be taken into account when generating due dates for an assignment.
And since assignments could always be due on a Sunday, per month basis, or any other restriction, it
would be best to allow assignments to handle vacations when generating the shifted due dates, instead
of altering post generation.
This also means that if a due date is shifted due to vacations, it should be marked as such.

Vacations should therefore ALWAYS have a start date and an end date (tentative). Even if indefinite, just put some large value.
Assignments, when generating schedules, should know about user vacations.
*/

/*
How to resolve assignments?

We must know:
- User vacations
- Assignment deadlines
- Assignment resolvers
- Submission date
- Submission content
- Current time

Result:
- We must be able to find the user's most recent submission for this assignment.
    - If the user does not have a submission for the assignment, then it should be in-complete.
    - Otherwise, it should be as expected.
- We must be able to check if the user's submission for the assignment is overdue.
    - We must therefore know the assignment due date for the user.
        - Due to vacations, this can factor into the user's deadline schedule.
- We must be able to assign submissions to the assignment for each user.
    - Since submission are just data, assignments must be able to determine itself by submission title and content.

Solution:
Assignment must have a schedule generator (that knows about vacations).

Should the assignment be responsible for resolving submission assignment?
- If assignments resolve it, submissions must save content for the assignment resolver.
- If parsers resolve it, submissions can be dependent on things other than content.
*/

/*
How to resolve submissions? Late and early submissions?

What do we want:
- The most recent submission. If the most recent is under review, we must save the base submission.

CAUTION:
- We do NOT process only the two most recent submissions because this can be a way to cheat the system.
By making MANY, but SMALL changes to the post, the program would never recognize the eventual divergence
from the base submission. It would think all the changes are too small to be relevant, but over many posts
these changes can add up. Therefore, the solution is to ONLY compare the most recent VALID solution and
the most recent solution. This also means that edited submissions that have gained slip days can only be
reviewed to remove ALL slip days, and therefore becomes valid, but not decrease the number of slip days.

What we must know:
- Submission date
- Submission content.
- The submission assignment.
- All submissions for the assignment.
- The assignment deadline.

Result:
- We must find the closest submission to the deadline, with priority to earlier submissions.
    - If no submissions exist, leave it blank.
    - If only late submissions exist, use the earliest one as the base.
    - If only early submissions exist, use the latest as the base.
    - If there are some of both, use the closest submission before the deadline as the base.
- Then use the most recent submission after as the target.
- Then, if the target and base are not the same, calculate the difference error from the base submission.
    - If the error is greater than a THRESHOLD, then flag for review.
    - Otherwise, use base as the MOST_RECENT_SUBMISSION.
*/

/**
 * Create SubmissionDatabase based on input file.
 * @param {Database} db The database to write to.
 * @param {Config} config The program config.
 * @param {String} filepath The path to the file to parse.
 * @param {Object} opts Any additional options.
 */
async function parse$2(db, config, filepath, opts={})
{
    setupDatabase$2(db);

    let first = true;
    await readCSVFileByRow(filepath, (row) => {
        // Skip header...
        if (first) { first = false; return; }

        // 0. Anonymous
        // 1. Post Number
        // 2. Folders
        // 3. Created At
        // 4. Submission
        // 5. Submission HTML Removed
        // 6. Subject
        // 7. Part of Post
        // 8. Name
        // 9. Email
        // 10. Endorsed by Instructor
        // ... CUSTOM DATA BELOW ...
        // 11. UCSD Email
        // 12. Start date
        // 13. Week
        // 14. Base Sunday
        // 15. Deadline
        // 16. Slip days used
        try
        {
            // Ignore follow-ups...
            const postPart = row[7];
            if (postPart === 'followup'
                || postPart === 'reply_to_followup'
                || postPart === 'started_off_i_answer'
                || postPart === 'updated_i_answer'
                || postPart === 'started_off_s_answer'
                || postPart === 'updated_s_answer') return;

            // NOTE: To use, requires ownerKey -> userID Mapping
            const ownerKey = parseEmail(row[9]);
            const submitDate = parse(row[3]);
            const postID = row[1];
            // NOTE: This has to be unique AND deterministic. In other words,
            // it must uniquely identify this submission given the same input.
            const submissionID = (Array.isArray(ownerKey) ? ownerKey[0] : ownerKey) + "#" + postID + "_" + stringHash(row[3]);

            const assignmentID = evaluatePostAssignment(row[6], row[5]);
            const attributes = {
                content: {
                    // Used to diff the content to determine if it should be
                    // considered a late submission or a minor edit.
                    head: row[6],
                    body: row[5],
                    // Used to auto-resolve unassigned assignments.
                    id: postID,
                }
            };

            const submission = addSubmission(db, submissionID, ownerKey, assignmentID, submitDate, attributes);
        }
        catch(e)
        {
            db.throwError('PARSE', 'Unable to parse submissions - ' + e);
        }
    });

    return db;
}

var ContributionsParser = /*#__PURE__*/Object.freeze({
    parse: parse$2
});

/**
 * Create ReviewDatabase based on input file.
 * @param {Database} db The database to write to.
 * @param {String} filepath The path to the file to parse.
 * @param {Object} opts Any additional options.
 */
async function parse$3(db, config, filepath, opts={})
{
    setupDatabase$3(db);

    let first = true;
    await readCSVFileByRow(filepath, (row) => {
        // Skip header...
        if (first) { first = false; return; }

        // 0. Review ID
        // 1. Review Date
        // 2. Comments
        // 3. Review Type
        // 4. Param[0]
        // 5. Param[1]
        // 6. Param[2]
        // ...
        try
        {
            const reviewID = row[0];
            let reviewDate;
            try
            {
                reviewDate = parse(row[1]);
            }
            catch(e)
            {
                reviewDate = new Date(Date.now());
            }
            const comments = row[2];
            const reviewType = row[3];
            const params = [];

            // Skip the initial stuff and iterate only over the infinite parameters... until an empty cell.
            for(let i = 4; i < row.length; ++i)
            {
                const param = row[i].trim();
                if (param.length <= 0) break;
                params.push(param);
            }

            const review = addReview(db, reviewID, reviewDate, comments, reviewType, params);
        }
        catch(e)
        {
            db.throwError('PARSE', 'Unable to parse reviews - ' + e);
        }
    });

    return db;
}

var ReviewsParser = /*#__PURE__*/Object.freeze({
    parse: parse$3
});

function getParserTypes()
{
    return [
        'cohort',
        'contributions',
        'reviews',
    ];
}

function loadParserByType(parserType)
{
    switch(parserType)
    {
        case 'cohort': return CohortParser;
        case 'contributions': return ContributionsParser;
        case 'reviews': return ReviewsParser;
        default:
            throw new Error([
                'Invalid input entry:',
                '=>',
                `Cannot find valid parser of type '${parserType}'.`,
                '<='
            ]);
    }
}

function loadCustomParser(filePath)
{
    try
    {
        const result = require(filePath);

        // Make sure it is a valid parser file...
        if (typeof result.parse !== 'function')
        {
            throw new Error([
                'Invalid custom parser file:',
                '=>',
                `Missing export for named function 'parse'.`,
                '<='
            ]);
        }
    }
    catch(e)
    {
        throw new Error([
            `Unable to import custom parser file:`,
            '=>',
            `File: '${filePath}'`, e,
            '<='
        ]);
    }
}

const MAX_GENERATED_ASSIGNMENTS = 100;

function assign(db, userID, assignmentID, dueDate, attributes = {})
{
    const ownerKeys = getOwnerKeysForUserID(db, userID);
    const newDueDate = offsetDateByVacations(db, ownerKeys, dueDate);
    return addAssignment(db, userID, assignmentID, newDueDate, attributes);
}

function assignWeekly(db, userID, assignmentBaseName, startDate, endDate, attributes = {})
{
    const ownerKeys = getOwnerKeysForUserID(db, userID);
    const vacations = getVacationsByOwnerKeys(db, ownerKeys);

    // Convert vacations to work week ranges...
    const timeOffRanges = [];
    for(const vacationID of vacations)
    {
        const vacation = getVacationByID(db, vacationID);
        timeOffRanges.push(createDateRange(vacation.userStartDate, vacation.userEndDate));
    }
    sortDateRanges(timeOffRanges);
    mergeDateRangesWithOverlap(timeOffRanges);
    const validator = createOffsetDelayValidator(timeOffRanges);
    const dueDates = generateWeeklySunday(startDate, endDate, validator);

    // Assign assignments to due date...
    const result = [];
    let assignmentCount = 0;
    for(const date of dueDates)
    {
        const assignment = addAssignment(db, userID, `${assignmentBaseName}[${assignmentCount + 1}]`, date, Object.assign({}, attributes));
        result.push(assignment);
        
        if (++assignmentCount > MAX_GENERATED_ASSIGNMENTS)
        {
            throw new Error('Reached maximum amount of assignments generated.')
        }
    }

    return result;
}

async function assign$1(db, name, userID, userSchedule, opts={})
{
    assignWeekly(db, userID, name, userSchedule.startDate, userSchedule.endDate);
}

var SundayAssignment = /*#__PURE__*/Object.freeze({
    assign: assign$1
});

async function assign$2(db, name, userID, userSchedule, opts={})
{
    assign(db, userID, name, new Date(userSchedule.lastSunday.getTime()));
}

var LastAssignment = /*#__PURE__*/Object.freeze({
    assign: assign$2
});

async function assign$3(db, name, userID, userSchedule, opts={})
{
    assign(db, userID, name, offsetDate(userSchedule.startDate, 7));
}

var IntroAssignment = /*#__PURE__*/Object.freeze({
    assign: assign$3
});

function getAssignmentTypes()
{
    return [
        'sunday',
        'intro',
        'last',
    ];
}

function loadAssignmentByType(assignmentType)
{
    switch(assignmentType)
    {
        case 'sunday': return SundayAssignment;
        case 'intro': return IntroAssignment;
        case 'last': return LastAssignment;
        default:
            throw new Error([
                'Invalid assignment entry:',
                '=>',
                `Cannot find valid assignment of type '${assignmentType}'.`,
                '<='
            ]);
    }
}

function loadCustomAssignment(filePath)
{
    try
    {
        const result = require(filePath);

        // Make sure it is a valid assignment file...
        if (typeof result.assign !== 'function')
        {
            throw new Error([
                'Invalid custom assignment file:',
                '=>',
                `Missing export for named function 'assign'.`,
                '<='
            ]);
        }
    }
    catch(e)
    {
        throw new Error([
            `Unable to import custom assignment file:`,
            '=>',
            `File: '${filePath}'`, e,
            '<='
        ]);
    }
}

function getOutputTypes()
{
    return [
        // The general expected output with all users and their slip days.
        'instructor',
        // The specific summary for each user, including options for pdf versions.
        'student',
        // The debug logs.
        'debug',
    ];
}

/**
 * This file is used to resolve parameters that may be missing in the config file.
 * 
 * @module ConfigParamResolver
 */

async function resolveInputs(directory)
{
    const inputs = [];
    await createResolver()
        .init("Want to add inputs?")
        .run(async () =>
        {
            const inputFilePath = await askFindFile("Choose an input file:",
                directory,
                value =>
                {
                    if (!value.startsWith(directory)) return "Must be under specified input path directory.";
                    return true;
                });
            const parser = await askChoose("Which parser should we use?",
                [...getParserTypes(), '(custom)']);
            
            const opts = {};
            if (parser === '(custom)')
            {
                const customPath = await askFindFile("Where is the custom script file?",
                    directory,
                    value =>
                    {
                        if (!value.endsWith('.js')) return "Must be a valid JavaScript file.";
                        if (!value.startsWith(directory)) return "Must be under specified input path directory.";
                        return true;
                    });
                opts.customPath = customPath;
            }
        
            const inputEntry = {
                inputName: inputFilePath.substring(directory.length + 1),
                parser,
                opts,
            };

            inputs.push(inputEntry);
            return inputEntry;
        })
        .again(async result =>
        {
            if (result) return await ask("Do you want to add another input?");
            return await ask("Do you want to try again?");
        })
        .resolve();
    
    return inputs;
}

async function resolveOutputs(directory)
{
    let choices = getOutputTypes();
    const outputs = await askPrompt("Which outputs do you want to generate?", 'select', {
        multiple: true,
        choices,
        initial: choices.slice(),
    });

    // TODO: This is should somehow allow loading custom output scripts.

    return outputs.map(value => ({
        outputName: value,
        format: value,
        opts: {}
    }));
}

async function resolveAssignments(directory)
{
    const assignments = [];
    if (await ask("Want to use the default assignments? (intro, week, last)"))
    {
        assignments.push(
            {
                assignmentName: 'intro',
                pattern: 'intro',
                opts: {},
            },
            {
                assignmentName: 'week',
                pattern: 'sunday',
                opts: {},
            },
            {
                assignmentName: 'last',
                pattern: 'last',
                opts: {},
            }
        );
    }
    // This is generic.
    else
    {
        await createResolver()
            .init("Want to add assignments?")
            .run(async () =>
            {
                log("What are the names of the assignments? These are used to uniquely identify each assignment \"class\".");
                const assignmentList = await askPrompt("Assignments (comma-separated)", 'list');

                const result = [];
                for(const assignmentName of assignmentList)
                {
                    const pattern = await askChoose(`What is the assignment schedule pattern for '${assignmentName}'?`,
                        [...getAssignmentTypes(), '(custom)']);

                    let opts = {};
                    if (pattern === '(custom)')
                    {
                        const customPath = await askFindFile("Where is the custom script file?",
                            absInputPath,
                            value =>
                            {
                                if (!value.endsWith('.js')) return "Must be a valid JavaScript file.";
                                if (!value.startsWith(absInputPath)) return "Must be under specified input path directory.";
                                return true;
                            });

                        opts.customPath = customPath;
                    }

                    result.push({
                        assignmentName,
                        pattern,
                        opts,
                    });
                }

                assignments.push(...result);
                return result;
            })
            .again(ifFailAndAgain("Do you want to try again?"))
            .resolve();
    }
    return assignments;
}

async function resolveInputPath(directory)
{
    const path = require('path');
    const inputPath = await askPath("Specify a new input path (directory with your input files)", directory, true, true);
    return path.resolve(directory, inputPath);
}

async function resolveDate()
{
    return await askDate('What is the date for the current run?', new Date(Date.now()));
}

async function resolveScheme()
{
    return await askChoose('What is the scheme you are using?', getSchemeNames());
}

/** If unable to load config file, null is returned. */
async function loadConfigFile(filepath)
{
    console.log("...Load config...");
    return await loadConfig(filepath);
}

/** If unable to request config file, null is returned. */
async function requestConfigFile(directory)
{
    console.log("...Request config...");
    return null;
    // return await ClientHandler.askForConfigFilePath(directory);
}

/** If unable to load default config file, null is returned. */
async function loadDefaultConfig(directory)
{
    console.log("...Load default config...");
    return {
        outputAutoDate: true,
        debug: false,
    }
}

async function createNewConfig(directory)
{
    return null;
}

async function validateConfig(config, directory)
{
    const fs = require('fs');
    const path = require('path');
    const chalk = require('chalk');

    if (!config.inputPath || !fs.existsSync(config.inputPath))
    {
        log(chalk.yellow("Missing valid input path..."));
        config.inputPath = await resolveInputPath(directory);
    }

    if (!config.outputPath || !fs.existsSync(config.outputPath))
    {
        debug("Missing valid output path...using working directory instead.");
        config.outputPath = directory;
    }

    if (!config.scheme)
    {
        log(chalk.yellow("Missing scheme..."));
        const scheme = await resolveScheme();
        config.scheme = scheme;
    }

    if (!config.assignments)
    {
        log(chalk.yellow("Missing assignment entries..."));
        const absInputPath = path.resolve(directory, config.inputPath);
        config.assignments = await resolveAssignments();
    }

    if (!config.inputs)
    {
        log(chalk.yellow("Missing input entries..."));
        const absInputPath = path.resolve(directory, config.inputPath);
        config.inputs = await resolveInputs(absInputPath);
    }

    if (!config.outputs)
    {
        log(chalk.yellow("Missing output entries..."));
        const absOutputPath = path.resolve(directory, config.outputPath);
        config.outputs = await resolveOutputs();
    }

    if (!config.currentDate)
    {
        log(chalk.yellow("Missing current date..."));
        const date = await resolveDate();
        config.currentDate = stringify(date);
    }
}

const PARSERS = new Set();

function registerParser(parser, inputFilePath, parserType, opts)
{
    PARSERS.add([parser, inputFilePath, parserType, opts]);
}

function getParsers()
{
    return PARSERS.values();
}

/**
 * This file is used to specifically load the input entries from the config file.
 * 
 * @module InputLoader
 */

/** If unable to find entries, an empty array is returned. */
async function findInputEntries(config)
{
    console.log("...Finding input entries...");
    if (Array.isArray(config.inputs))
    {
        const result = config.inputs;

        // Validate input entries...
        const errors = [];
        for(const inputEntry of result)
        {
            try
            {
                validateInputEntry(config, inputEntry);
            }
            catch(e)
            {
                errors.push(e);
            }
        }

        if (errors.length > 0)
        {
            throw new Error([
                'Failed to resolve input entries from config:',
                '=>',
                errors,
                '<='
            ]);
        }
        else
        {
            return result;
        }
    }
    else
    {
        return [];
    }
}

/**
 * Guaranteed to load input entry. Will throw an error if failed.
 * Also assumes that inputEntry is valid.
 */
async function loadInputEntry(db, config, inputEntry)
{
    console.log(`...Process input entry '${inputEntry.inputName}'...`);
    const inputPath = config.inputPath || '.';
    const inputName = inputEntry.inputName;
    const filePath = path$6.resolve(inputPath, inputName);
    const parserType = inputEntry.parser;
    const customPath = inputEntry.customPath;
    const opts = inputEntry.opts || {};

    let Parser;
    try
    {
        // customPath will override parserType if defined.
        if (customPath)
        {
            Parser = loadCustomParser(customPath);
        }
        else
        {
            Parser = loadParserByType(parserType);
        }
    }
    catch(e)
    {
        throw new Error([
            `Failed to resolve input entry from config:`,
            '=>',
            e,
            '<='
        ]);
    }

    registerParser(Parser, filePath, customPath || parserType, opts);
}

function validateInputEntry(config, inputEntry)
{
    const errors = [];

    const inputPath = config.inputPath || '.';
    const inputName = inputEntry.inputName;
    const inputFilePath = path$6.resolve(inputPath, inputName);
    const parserType = inputEntry.parser;
    const customPath = inputEntry.customPath;

    if (!inputName)
    {
        errors.push([
            'Invalid input entry:',
            '=>',
            `Missing required property 'inputName'.`,
            '<='
        ]);
    }

    if (!fs$2.existsSync(inputFilePath))
    ;

    if (!parserType && !customPath)
    {
        errors.push([
            'Invalid input entry:',
            '=>',
            `Missing one of property 'parser' or 'customPath'.`,
            '<='
        ]);
    }

    if (customPath && !fs$2.existsSync(customPath))
    {
        errors.push([
            `Cannot find custom parser file '${path$6.basename(customPath)}':`,
            '=>',
            `File does not exist: '${customPath}'.`,
            '<='
        ]);
    }

    if (errors.length > 0)
    {
        throw new Error([
            'Failed to validate input entry:',
            '=>',
            errors,
            '<='
        ]);
    }
}

/**
 * This file is used to load and apply input parsers from the config to the database.
 * 
 * @module InputHandler
 */

async function loadInputsFromConfig(db, config)
{
    const inputEntries = await findInputEntries(config);
    for(const inputEntry of inputEntries)
    {
        try
        {
            await loadInputEntry(db, config, inputEntry);
        }
        catch(e)
        {
            await skippedError(`Failed to load input entry '${inputEntry.inputName}'`, e);
        }
    }
}

async function applyParsersToDatabase(db, config)
{
    for(const parser of getParsers())
    {
        const [parserFunction, filePath, parserType, opts] = parser;

        // File path is not GUARANTEED to exist...
        if (fs$2.existsSync(filePath))
        {
            console.log(`...Parsing '${path$6.basename(filePath)}' with '${path$6.basename(parserType)}'...`);
            await parserFunction.parse(db, config, filePath, opts);
        }
        else
        {
            await skippedError(`Failed to find file '${path$6.basename(filePath)}' for parser`, new Error('File does not exist.'));
        }
    }
}

const ASSIGNERS = new Map();

function registerAssigner(name, assigner, pattern, opts)
{
    ASSIGNERS.set(name, [assigner, pattern, name, opts]);
}

function getAssigners()
{
    return ASSIGNERS.values();
}

/**
 * This file is used to specifically load the assignment entries from the config file.
 * 
 * @module AssignmentLoader
 */

/** If unable to find entries, an empty array is returned. */
async function findAssignmentEntries(config)
{
    console.log("...Finding assignment entries...");
    if (Array.isArray(config.assignments))
    {
        const result = config.assignments;

        // Validate assignment entries...
        const errors = [];
        for(const assignmentEntry of result)
        {
            try
            {
                validateAssignmentEntry(config, assignmentEntry);
            }
            catch(e)
            {
                errors.push(e);
            }
        }

        if (errors.length > 0)
        {
            throw new Error([
                'Failed to resolve assignment entries from config:',
                '=>', errors, '<=' ]);
        }
        else
        {
            return result;
        }
    }
    else
    {
        return [];
    }
}

/**
 * Guaranteed to load assignment entry. Will throw an error if failed.
 * Also assumes that assignmentEntry is valid.
 */
async function loadAssignmentEntry(db, config, assignmentEntry)
{
    console.log(`...Process assignment entry '${assignmentEntry.assignmentName}'...`);
    const assignmentName = assignmentEntry.assignmentName;
    const patternType = assignmentEntry.pattern;
    const customPath = assignmentEntry.customPath;
    const opts = assignmentEntry.opts || {};

    let Assignment;

    try
    {
        // customPath will override patternType if defined.
        if (customPath)
        {
            Assignment = loadCustomAssignment(customPath);
        }
        else
        {
            Assignment = loadAssignmentByType(patternType);
        }
    }
    catch(e)
    {
        throw new Error([
            `Failed to resolve assignment entry from config:`,
            '=>', e, '<='
        ]);
    }

    registerAssigner(assignmentName, Assignment, customPath || patternType, opts);
}

function validateAssignmentEntry(config, assignmentEntry)
{
    const errors = [];

    const assignmentName = assignmentEntry.assignmentName;
    const patternType = assignmentEntry.pattern;
    const customPath = assignmentEntry.customPath;

    if (!assignmentName)
    {
        errors.push([
            'Invalid assignment entry:',
            '=>', `Missing required property 'assignmentName'.`, '<='
        ]);
    }

    if (!patternType && !customPath)
    {
        errors.push([
            'Invalid assignment entry:',
            '=>', `Missing one of property 'pattern' or 'customPath'.`, '<='
        ]);
    }

    if (customPath && !fs$2.existsSync(customPath))
    {
        errors.push([
            `Cannot find custom assignment file '${path$6.basename(customPath)}':`,
            '=>', `File does not exist: '${customPath}'.`, '<='
        ]);
    }

    if (errors.length > 0)
    {
        throw new Error([
            'Failed to validate assignment entry:',
            '=>', errors, '<='
        ]);
    }
}

/**
 * This file is used to load and apply assignments from the config to the database.
 * 
 * @module AssignmentHandler
 */

async function loadAssignmentsFromConfig(db, config)
{
    const assignmentEntries = await findAssignmentEntries(config);
    for(const assignmentEntry of assignmentEntries)
    {
        try
        {
            await loadAssignmentEntry(db, config, assignmentEntry);
        }
        catch(e)
        {
            console.error('Failed to load assignment entry.', e);
        }
    }
}

async function applyAssignersToDatabase(db, config)
{
    for(const assigner of getAssigners())
    {
        const [assignmentFunction, pattern, name, opts] = assigner;
        console.log(`...Assigning '${name}' as '${pattern}'...`);

        for(const userID of getUsers(db))
        {
            const user = getUserByID(db, userID);
            const schedule = user.schedule;
            await assignmentFunction.assign(db, name, userID, schedule, opts);
        }
    }
}

/**
 * This file is used to specifically load the vacation entries from the review file.
 * 
 * @module VacationLoader
 */

/**
 * This needs to load and populate the VacationDatabase BEFORE assigners are loaded.
 * But all of this happens from the input of the ReviewDatabase.
 * Therefore, between input and assign data, vacations must be generated.
 */
async function loadVacationsFromReviews(db, config)
{
    await review$g(db, config, db[REVIEW_KEY]);
}

/** Guaranteed to succeed. */
async function createDatabase$1(config)
{
    console.log("...Creating database...");
    return await setupDatabase$5(config);
}

/**
 * This prepares the database will all STATIC data that WILL NOT change over
 * the program's lifecycle. This includes custom scripts, input entries, etc.
 * This does NOT include the input DATA. Refer to populateDatabaseWithInputs()
 * for that.
 */
async function prepareDatabaseForInputs(db, config)
{
    console.log("...Load database from inputs...");
    await loadInputsFromConfig(db, config);

    console.log("...Load database from assignments...");
    await loadAssignmentsFromConfig(db, config);
}

/** This is used, alongside ReviewHandler.fixDatabaseWithReviews(), in both the input and validation stage. */
async function populateDatabaseWithInputs(db, config)
{
    // Load input data...
    await applyParsersToDatabase(db, config);

    // Load vacation data... (this MUST come before assignment data but after user/schedule data)
    // ... and since this is a review now, it CAN change during the program's lifecycle...
    await loadVacationsFromReviews(db, config);

    // Load assignment data...
    await applyAssignersToDatabase(db);
}

async function verifyDatabaseWithClient(db, config)
{
    console.log("...Verifying database with client...");
    return await askWhetherDatabaseIsValidToUse(db, config);
}

const path$2 = require('path');

async function output$1(db, config, outputPath, opts)
{

    const tableBuilder = new TableBuilder();
    tableBuilder.addColumn('User ID');
    tableBuilder.addColumn('Name', (userID) => {
        return getUserByID(db, userID).name;
    });
    tableBuilder.addColumn('Used Slips', (userID) => {
        return getUserByID(db, userID).attributes.slips.used;
    });
    tableBuilder.addColumn('Remaining Slips', (userID) => {
        return getUserByID(db, userID).attributes.slips.remaining;
    });
    tableBuilder.addColumn('Average Slips (Median)', (userID) => {
        return getUserByID(db, userID).attributes.slips.median;
    });
    tableBuilder.addColumn('Max Slips', (userID) => {
        return getUserByID(db, userID).attributes.slips.max;
    });
    tableBuilder.addColumn('Missing Assignments', (userID) => {
        return getUserByID(db, userID).attributes.progress.missing;
    });
    tableBuilder.addColumn('Auto-report', (userID) => {
        // The auto-report threshold formula
        let flag = false;
        // Check the average if maintained from today, would it exceed by the end date.
        const userAttributes = getUserByID(db, userID).attributes;
        const averageSlips = userAttributes.slips.mean;
        const remainingAssignments = userAttributes.progress.missing + userAttributes.progress.unassigned;
        if (averageSlips * remainingAssignments > userAttributes.slips.max)
        {
            flag = true;
        }
        // TODO: Check if there are any holes in submissions.
        // TODO: Check if intro or week 1 is past due date.
        // ...and the result...
        if (flag)
        {
            return 'NOTICE!';
        }
        else
        {
            return 'N/A';
        }
    });

    // Most recently submitted assignments...
    const usedAssignments = new Set();
    for(const userID of getUsers(db))
    {
        const assignmentIDs = getAssignmentsByUser(db, userID);
        for(const assignmentID of assignmentIDs)
        {
            if (!usedAssignments.has(assignmentID))
            {
                const assignment = getAssignmentByID(db, userID, assignmentID);
                if (assignment.attributes.status !== '_')
                {
                    usedAssignments.add(assignmentID);
                }
            }
        }
    }
    const recentAssignments = Array.from(usedAssignments).reverse();

    // Add assignments to table...
    for(const assignmentID of recentAssignments)
    {
        tableBuilder.addColumn(assignmentID + ' Status', (userID) => {
            const assignment = getAssignmentByID(db, userID, assignmentID);
            if (!assignment) return '';
            return assignment.attributes.status;
        });
        tableBuilder.addColumn(assignmentID + ' Slips', (userID) => {
            const assignment = getAssignmentByID(db, userID, assignmentID);
            if (!assignment) return '';
            return assignment.attributes.slipDays;
        });
    }

    // Populate the table...
    for(const userID of getUsers(db))
    {
        tableBuilder.addEntry(userID);
    }
    
    const outputTable = tableBuilder.build();
    await writeTableToCSV(outputPath, outputTable);
}

var InstructorReportOutput = /*#__PURE__*/Object.freeze({
    output: output$1
});

/**
    Name: Bob Ross
    PID: A12345678
    Date: August 9, 2019
    Your weekly student report:
    Week 0 - Completed
    Week 1 - Completed (4 slip-day(s) used)
    Week 2 - Completed (1 slip-day(s) used) - In-Review
    Week 3 - Missing (9+? slip-day(s) used)
    Week 4 - Completed
    Week 5 - Completed
    Week 6 - Missing (6+? slip-day(s) used)

    Weeks remaining: 2
    Daily accruing slip-days: -2
    Remaining slip-days available: 4

    IMPORTANT:
        Missing assignment for Week 3 and Week 6.

    You must turn in all assignments, even if late. These will continue to accrue slip-days until it is turned in. Based on the number of slip-days available, you have 2 more days until all slip-days are used. To not be deducted points, you must submit the assignments on or before August 11, 2019.

    *In-Review: Significant difference has been found for the submission for the week past the deadline. A review is being conducted to evaluate number slip days used. Until resolved, it will assume the latest submission time is accurate.
 */

function stringifyStatus(status, slipDays = 0)
{
    let rateString;
    if (status === 'N' && slipDays > 0)
    {
        rateString = '+?';
    }
    else
    {
        rateString = '';
    }

    let slipString;
    if (slipDays > 0)
    {
        slipString = ` (${slipDays}${rateString} slip day(s) used)`;
    }
    else
    {
        slipString = '';
    }

    let statusString;
    switch(status)
    {
        case 'Y':
            statusString = 'Completed';
            break;
        case 'N':
            statusString = 'Missing';
            break;
        case '_':
            statusString = 'Not yet assigned';
            break;
        default:
            statusString = 'Unknown';
            break;
    }

    return statusString + slipString;
}

function generateProgressReport(db, config, userID)
{
    const user = getUserByID(db, userID);
    const dst = [];

    dst.push('Name: ' + user.name);
    dst.push('PID: ' + user.attributes.pid);
    dst.push('Date: ' + db.currentDate.toDateString());
    dst.push('');
    if (config.customIntro)
    {
        dst.push(config.customIntro);
        dst.push('');
    }
    dst.push('Your weekly student report:');
    const assignments = getAssignmentsByUser(db, userID);
    const inReviewAssignments = [];
    const missingAssignments = [];
    let accruedSlips = 0;
    let slipRate = 0;
    for(const assignmentID of assignments)
    {
        const assignment = getAssignmentByID(db, userID, assignmentID);
        if (assignment.attributes.status === 'N')
        {
            missingAssignments.push(assignment);
            slipRate += 1;
        }
        else if (assignment.attributes.status === '?')
        {
            inReviewAssignments.push(assignment);
        }
        accruedSlips += assignment.attributes.slipDays;
        dst.push(assignment.id + ' - ' + stringifyStatus(assignment.attributes.status, assignment.attributes.slipDays));
    }
    dst.push('');
    const schedule = user.schedule;
    const totalSlipDays = calculateNumberOfSlipDays(schedule);
    // TODO: The issue with this is that assignments != schedule weeks. There can be more than 1 assigment in a week.
    // dst.push('Weeks Remaining:' + (schedule.weeks - (assignments.length - missingAssignments.length)));
    dst.push('Daily accruing slip days: ' + slipRate);
    dst.push('Remaining slip days available: ' + (totalSlipDays - accruedSlips));
    dst.push('');

    if (missingAssignments.length > 0)
    {
        dst.push('IMPORTANT:');
        dst.push('');

        dst.push('Missing assignment for ' + missingAssignments.map((value) => value.id).join(', ') + '.');

        dst.push('');
        dst.push('You must turn in all assignments, even if late. These will continue to accrue slip-days until it is turned in.');

        // Calculate this based on schedule...
        /*
        const remainingDays = 0;
        const finalDueDate = 0;
        dst.push(`Based on the number of slip-days available, you have ${remainingDays} more days until all slip-days are used. To not be deducted points, you must submit the assignments on or before ${finalDueDate}.`);
        */

        dst.push('');
    }

    if (config.customOutro)
    {
        dst.push(config.customOutro);
        dst.push('');
    }

    if (inReviewAssignments.length > 0)
    {
        dst.push('*In-Review: Significant difference has been found for the submission for the week past the deadline. A review is being conducted to evaluate number slip days used. Until resolved, it will assume the latest submission time is accurate.');
    }

    dst.push('');

    return "\"" + dst.join('\n') + "\"";
}

function generateNoticeReport(db, userID)
{
    return 'N/A';
}

async function output$2(db, config, outputPath, opts)
{
    const tableBuilder = new TableBuilder();
    tableBuilder.addColumn('User ID');
    tableBuilder.addColumn('User Name', (userID) => {
        return getUserByID(db, userID).name;
    });
    tableBuilder.addColumn('Progress Report', (userID) => {
        return generateProgressReport(db, config, userID);
    });
    tableBuilder.addColumn('Notice Report', (userID) => {
        return generateNoticeReport();
    });

    // Populate the table...
    for(const userID of getUsers(db))
    {
        tableBuilder.addEntry(userID);
    }
    
    const outputTable = tableBuilder.build();
    await writeTableToCSV(outputPath, outputTable);

    // Output as a PDF as well...
    if (opts.exportPDF)
    {
        const fs = require('fs');
        const path = require('path');

        const pdfPath = path.resolve(path.dirname(outputPath), typeof opts.exportPDF === 'string' ? opts.exportPDF : 'reports.pdf');

        // Make sure PDF exports don't overwrite either...
        if (!await checkExistsOverwrite(pdfPath)) return;

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(pdfPath));

        let headerFlag = true;
        for(const outputRow of outputTable)
        {
            if (headerFlag)
            {
                headerFlag = false;
                continue;
            }
            const reportContent = outputRow[2];
            doc.addPage()
                .fontSize(16)
                .text(reportContent.substring(1, reportContent.length - 1));
        }
        doc.end();
        console.log("File saved: " + pdfPath);
    }
}

var StudentReportOutput = /*#__PURE__*/Object.freeze({
    output: output$2
});

const path$3 = require('path');

async function output$3(db, config, outputPath, opts)
{
    // Output all database logs...
    const outputFunction = writeToFile;
    try { await outputLog$1(db, outputFunction, outputPath); }
    catch(e) { console.error('Failed to output log.'); }
    try { await outputLog$2(db, outputFunction, outputPath); }
    catch(e) { console.error('Failed to output log.'); }
    try { await outputLog(db, outputFunction, outputPath); }
    catch(e) { console.error('Failed to output log.'); }
    try { await outputLog$3(db, outputFunction, outputPath); }
    catch(e) { console.error('Failed to output log.'); }
    try { await outputLog$4(db, outputFunction, outputPath); }
    catch(e) { console.error('Failed to output log.'); }

    // Output computed config file...
    try { await writeToFile(path$3.resolve(outputPath, 'config.log'), JSON.stringify(config, null, 4)); }
    catch(e) { console.error('Failed to output config log.'); }

    // Output error list...
    try
    {
        let output;
        if (db.getErrors().length <= 0)
        {
            output = "HOORAY! No errors!";
        }
        else
        {
            let errors = [];
            for(const error of db.getErrors())
            {
                errors.push(`${error.id}: [${error.tag}] ${error.message}\n=== SOLUTIONS: ===\n => ${error.options.join('\n => ')}\n=== MOREINFO: ===\n${error.more.join('\n')}\n`);
            }
            output = "It's okay. We'll get through this.\n\n" + errors.join('\n');
        }
        await writeToFile(path$3.resolve(outputPath, 'errors.txt'), output);
    }
    catch(e) { console.error('Failed to output error log.'); }

    // Output database cache...
    try
    {
        const output = JSON.stringify(db.getCache(), null, 4);
        await writeToFile(path$3.resolve(outputPath, 'cache.txt'), output);
    }
    catch(e) { console.error('Failed to output cache log.'); }
}

var DebugReportOutput = /*#__PURE__*/Object.freeze({
    output: output$3
});

const path$4 = require('path');

function findOutputEntries(config)
{
    console.log("...Finding output entries...");
    if (Array.isArray(config.outputs))
    {
        return config.outputs;
    }
    else
    {
        return [];
    }
}

async function processOutputEntry(db, config, outputEntry)
{
    console.log("...Process output entry...");
    const outputPath = config.outputPath;
    const outputName = outputEntry.outputName;
    const outputAutoDate = config.outputAutoDate || false;
    const filePath = path$4.resolve(outputPath + (outputAutoDate ? '/' + stringify(db.currentDate, false) : ''), outputName);
    const formatType = outputEntry.format;
    const customFormatPath = outputEntry.customFormatPath;
    const opts = outputEntry.opts;

    let Format;

    // If customFormatPath is defined, ignore formatType.
    if (customFormatPath)
    {
        try
        {
            Format = require(customFormatPath);
            if (typeof Format.output !== 'function')
            {
                throw new Error(`Invalid custom format '${customFormatPath}' - must export named function 'output'.`);
            }
        }
        catch(e)
        {
            throw new Error(`Cannot load custom format from '${customFormatPath}'.`, e);
        }
    }
    // No customFormatPath, so use formatType.
    else
    {
        switch(formatType)
        {
            case 'instructor':
                Format = InstructorReportOutput;
                break;
            case 'student':
                Format = StudentReportOutput;
                break;
            case 'debug':
                Format = DebugReportOutput;
                break;
            default:
                throw new Error(`Cannot find valid output of type '${formatType}'.`);
        }
    }

    await Format.output(db, config, filePath, opts);
}

async function outputDebugLog(db, config)
{
    if (await askWhetherToSaveDebugInfo())
    {
        let filePath;
        if (config)
        {
            const outputPath = config.outputPath;
            const outputAutoDate = config.outputAutoDate || false;
            filePath = outputPath + (outputAutoDate ? '/' + stringify(db.currentDate, false) : '');
        }
        else
        {
            filePath = '.';
        }
        await output$3(db, config, filePath);
    }
    else
    {
        showSkippingDebugLog();
    }
}

/** Tries to resolve the errors with reviews. */
async function run(db, config, errors, cache = {})
{
    cache.errors = errors;
    cache.reviews = [];

    const errorMapping = new Map();
    for(const error of errors)
    {
        errorMapping.set(error.id, error);
    }

    /**
     * First, show all the errors and let the client pick one or many.
     * This should have preliminary info to figure out what to do next.
     * If the client has picked some, ask if they want to ignore these or review them.
     * If ignore, store the error ids to hide them next time.
     * If review, enter review mode for all selected reviews.
     * Do they want to save the reviews somewhere? Do they want to review some more?
     * Return anything we have.
     */

    try
    {
        const chosenErrorIDs = await askChooseError("What error do you want to review?", errors, errorMapping);
        if (!chosenErrorIDs) throw null;
        
        const chosenErrors = [];
        for(const errorID of chosenErrorIDs)
        {
            const error = errorMapping.get(errorID);
            chosenErrors.push(error);
        }
    
        if (await askClientToReviewErrors(chosenErrors))
        {
            const reviewResult = await doReviewSession(db, config, INSTANCE, chosenErrors);
            cache.reviews.push(...reviewResult);
        }
    }
    catch(e)
    {
        if (e && e.message && e.message.length > 0)
        {
            throw e;
        }
        else
        {
            error("Review interrupted. Restarting review session...", true);
        }
    }
}

async function askChooseError(message, errors, errorMapping)
{
    const choices = [];

    for(const error of errors)
    {
        if (!errorMapping.has(error.id)) throw new Error('Error map does not match error list.');
        choices.push({
            name: error.id,
            message: formatErrorAsChoice(error),
            value: error.id,
        });
    }
    choices.push(CHOICE_SEPARATOR);

    return await askPrompt(message, 'autocomplete', {
        multiple: true,
        limit: 4,
        choices,
        validate: result => {
            if (result.length <= 0) return "Must select at least one error (use 'space' to select).";
            const type = errorMapping.get(result[0]).type;
            for(const errorID of result)
            {
                const error = errorMapping.get(errorID);
                if (error.type !== type)
                {
                    return `Cannot batch process errors of different type (${type} != ${error.type})`;
                }
            }
            return true;
        }
    });
}

function formatErrorAsChoice(error)
{
    const first = ``;
    const second = `${chalk$1.gray(error.id + ': ')} ${error.message}`;
    let third;
    if (error.info && error.info.length > 70)
    {
        third = chalk$1.italic.gray(error.info.substring(0, 70));
    }
    else
    {
        third = chalk$1.italic.gray(error.info) || '';
    }
    return [first, second, third].join('\n');
}

async function askClientToReviewErrors(errors)
{
    // Show all solutions
    const solutions = new Set();
    for(const error of errors)
    {
        for(const option of error.options)
        {
            solutions.add(option);
        }
    }
    const errorSolutions = `${chalk$1.green(`${chalk$1.bold(`= Solutions: ${'='.repeat(67)}`)}\n => ${Array.from(solutions).join('\n => ')}\n${chalk$1.bold('='.repeat(80))}`)}`;
    log(errorSolutions);

    // Show more info for each one...
    if (await ask("Show more info?"))
    {
        for(const error of errors)
        {
            await showErrorInfo(error);
        }
    }

    return await ask("Continue to review?");
}

async function showErrorInfo(error$1)
{
    if (!error$1) return;

    const errorMessage = `${chalk$1.gray(error$1.id + ':')} ${error$1.message}`;
    error(errorMessage, true);

    const errorSolutions = `${chalk$1.green(`${chalk$1.bold(`= Solutions: ${'='.repeat(67)}`)}\n => ${error$1.options.join('\n => ')}\n${chalk$1.bold('='.repeat(80))}`)}`;
    log(errorSolutions);

    const errorInfo = `${chalk$1.yellow(`${chalk$1.bold(`= More Info: ${'='.repeat(67)}`)}\n | ${error$1.more.join('\n')}\n${'='.repeat(80)}`)}`;
    log(errorInfo);
}

/**
 * @returns {Array<Review>} The reviews generated for the list of errors.
 * If none were created, it will be an array of length 0.
 */
async function doReviewSession(db, config, reviewRegistry, errors)
{
    if (errors.length <= 0) throw new Error('Cannot review empty error list.');

    const reviewType = await chooseReviewType(reviewRegistry);
    const review = reviewRegistry.getReviewByType(reviewType);

    if (!review || typeof review.build !== 'function')
    {
        throw new Error('Cannot build review with review-only review type.');
    }

    // TODO: review.build() params should be changed to match (db, config, errors) for consistency.
    return await review.build(errors, db, config);
}

async function chooseReviewType(reviewRegistry)
{
    const buildableReviewTypes = [];
    for(const reviewType of reviewRegistry.getReviewTypes())
    {
        const review = reviewRegistry.getReviewByType(reviewType);
        if ('build' in review && typeof review.build === 'function')
        {
            buildableReviewTypes.push(reviewType);
        }
    }
    const result = await askPrompt("What type of review do you want to make?", "autocomplete", {
        limit: 10,
        choices: buildableReviewTypes,
    });
    return result;
}

/** If unable to find errors, an empty array is returned. */
async function findDatabaseErrors(db, config)
{
    console.log("...Finding database errors...");

    const result = db.getErrors();
    if (!result || result.length <= 0)
    {
        await celebrateNoErrors();
        return null;
    }
    else
    {
        return result;
    }
}

async function shouldContinueResolvingErrorsWithClient(db, config, errors)
{
    return askWhetherToReviewErrors(db, config, errors);
}

async function resolveDatabaseErrors(db, config, errors)
{
    console.log("...Resolving database errors...");

    try
    {
        const cache = db.getCache().reviewSession = {};
        await run(db, config, errors, cache);
        if (cache.reviews && cache.reviews.length > 0)
        {
            return cache.reviews;
        }
        else
        {
            return null;
        }
    }
    catch(e)
    {
        error('Error has occured.', true);
        const cache = db.getCache();
        await shouldSaveReviewsForClient(db, config, cache.reviewSession && cache.reviewSession.reviews);
        throw e;
    }
}

async function clearDatabase$6(db, config)
{
    console.log("...Clearing database...");
    clearDatabase$5(db);
}

async function verifyErrorsWithClient(db, config, errors)
{
    if (!errors || errors.length <= 0) return true;
    
    return await askWhetherToIgnoreErrors(db, config, errors);
}

async function outputErrorLog(db, config, errors)
{
    console.log("...Outputting database errors...");
    
    // This will also output the error log...
    await outputDebugLog(db, config);
}

/**
 * This file handles the macro-level logical flow of the program.
 * This is used by `main.js`, alongside `ClientApplication` to
 * execute and process the entire program.
 * 
 * The program's process is further broken down into handlers; each
 * handler controls a certain stage of the program. There is usually
 * one handler per stage, but there are a couple exceptions.
 * 
 * @module MainApplication
 */

/**
 * Guarantees a config will be returned. It will throw an error if unable to.
 * @param {String} directory The root project directory.
 * @returns {Config} The config.
 */
async function resolveConfig(directory)
{
    console.log("Resolving config...");

    // Try to load the provided config file in the directory...
    let config;
    try
    {
        config = await loadConfigFile(directory);
    }
    catch(e)
    {
        // Try other fallback config files... maybe ask for one?
        let configFilePath;
        while (configFilePath = await requestConfigFile())
        {
            try
            {
                // Found config file. Load it up.
                config = await loadConfigFile(configFilePath);
                if (config) break;
            }
            catch(e)
            {
                // Failed to load config. Try again.
            }
        }
        
        // More fallbacks...
        if (!config) config = await createNewConfig();
        if (!config) config = await loadDefaultConfig();
    }

    if (!config)
    {
        // This should never happen...
        throw new Error('Could not resolve a config file for program. Stopping program...');
    }

    await validateConfig(config, directory);

    return config;
}

/**
 * Guarantees a database will be returned. It will throw an error if unable to.
 * @param {Config} config The config.
 * @returns {Database} The database.
 */
async function resolveDatabase(config)
{
    console.log("Resolving database...");

    // Creates an empty database (with no structure at all)...
    const db = await createDatabase$1(config);

    // Prepare review registry with schemes...
    await prepareDatabaseForScheme(db, config, config.scheme);

    // Try to prepare all database entries from config...
    await prepareDatabaseForInputs(db, config);

    // Try to load all database entries from config...
    await populateDatabaseWithInputs(db, config);

    // Apply the database review fixes...
    await fixDatabaseWithReviews(db, config);

    // Check with the user if it is okay to continue, based on some data stats...
    if (!await verifyDatabaseWithClient(db, config))
    {
        throw new Error('Could not resolve database for program. Please update the config to match your specifications, then try again.');
    }
    return db;
}

/**
 * Guarantees to prepare the database for output. Otherwise, it will throw an error.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
async function validateDatabase(db, config)
{
    console.log("Validating database...");

    // Apply reviews...
    let reviews = [];
    let errors;
    while(errors = await findDatabaseErrors(db))
    {
        // Check whether the client wants to continue resolving errors... cause there could be a lot.
        if (await shouldContinueResolvingErrorsWithClient(db, config, errors))
        {
            const result = await resolveDatabaseErrors(db, config, errors);

            // If review was successful...
            if (result && result.length > 0)
            {
                reviews.push(...result);

                // Restart the database...
                await clearDatabase$6(db);
    
                // Re-apply all the data...
                await populateDatabaseWithInputs(db, config);
                // Re-apply the new reviews...
                await populateDatabaseWithAdditionalReviews(db, config, reviews);

                // Re-fix them...
                await fixDatabaseWithReviews(db, config);
            }

            // And go back to check for errors again...
        }
        else
        {
            break;
        }
    }
    
    // Whether to save any newly created reviews...
    if (await shouldSaveReviewsForClient(db, config, reviews))
    {
        // This is null because we want to output all of it...
        await outputReviewsToFile(db, config);
    }

    // Whether to ignore errors or continue as normal...
    if (!await verifyErrorsWithClient(db, config, errors))
    {
        // IT'S AN ERROR! RUN AWAY!!!
        throw new Error('Cannot resolve errors. Stopping program...');
    }

    // All is well.
}

/**
 * Guarantees no changes will be made to the database or the config.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
async function generateOutput(db, config)
{
    console.log("Generating output...");

    const outputEntries = findOutputEntries(config);

    for(const outputEntry of outputEntries)
    {
        try
        {
            await processOutputEntry(db, config, outputEntry);
        }
        catch(e)
        {
            console.error('Failed to process output entry.', e);
        }
    }
}

const version = "1.0.0";

/**
 * This file handles the extra client interface of the program.
 * This is used by `main.js`, alongside `MainApplication` to
 * execute and process the entire program.
 * 
 * As of right now, this serves only to "inject" extra information
 * that the client would want to see that is not relevant to
 * the main program.
 * 
 * @module ClientApplication
 */

async function onStart(directory, args)
{
    doTheBigTitleThing('Progress Auditor', `Version v${version}`);
    log('');

    log('Running from directory: ' + directory);
    log('');

    debug('== Quick Tutorial ==');
    debug(`1) To submit your answer, press 'enter'.`);
    debug(`2) Use 'space' to select multiple options.`);
    debug(`3) Navigate selection with 'up' and 'down'.`);
    debug('');
    log(`NOTICE: At any point in time you want to cancel, press 'escape' to abort the current operation.`);
    debug('');
}

async function onSetup(db, config)
{
    /**
     * Loading - Where all data should be loaded from file. This
     * should be raw data as defined by the user. No modifications
     * should take place; they will be considered for alterations
     * in the processing stage.
     */
}

async function onPreProcess(db, config)
{
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
}

async function onPostProcess(db, config)
{

}

async function onOutput(db, config)
{
    /**
     * Outputting - Where all data is outputted into relevant
     * files. If any errors had occured, it will exit-early and
     * output any gathered debug information.
     */
}

async function onError(db, config, error)
{
    try
    {
        // Last ditch attempt to save progress...
        outputErrorLog(db, config, [error]);
    }
    catch(e) {}
}

async function onStop(db, config)
{

}

async function showError(db, config, error)
{
    formattedError(error, (config && config.debug) || false);
}

async function tryRestartOnError(db, config, error)
{
    // Usually we ask after an error or something.
    return await ask('Could not resolve errors. Restart?');
}

// NOTE: This should be it's own bundled file for plugins to use. But for now, it's a global.

const path$5 = require('path');

/**
 * The entry point to the program.
 */
async function main(args)
{
    // The root project directory
    const DIRECTORY = args.length > 2 ? path$5.resolve(args[2]) : path$5.resolve(process.execPath, '..');

    await onStart(DIRECTORY);
    
    let config;
    let db;
    try
    {
        // Starting setup...
        config = await resolveConfig(DIRECTORY);
        db = await resolveDatabase(config);

        await onSetup(db, config);
        await onPreProcess(db, config);

        // All setup is GUARANTEED to be done now. Reviews are now to be processed...
        // Any errors that dare to surface will be vanquished here. Or ignored...
        await validateDatabase(db, config);
        await onPostProcess(db, config);
    
        // All validation is GUARANTEED to be done now. Outputs can now be generated...
        await generateOutput(db, config);
        await onOutput(db, config);
    }
    catch(e)
    {
        await showError(db, config, e);

        if (await tryRestartOnError())
        {
            return await main(args);
        }
        else
        {
            await onError(db, config, e);
            return false;
        }
    }

    await onStop();
    return true;
}

/*
// Testing...
import './util/DateTest.js';
export async function main() {};
*/

main(process.argv).then(result => {
    if (result)
    {
        console.log("Success!");
    }
    else
    {
        console.log("Failure!");
    }
});

/**
 * This program will generate reports based on the supplied database
 * of users, submissions, reviews and other logistical information.
 * The first argument is the root config file. This JSON file specifies
 * all the options necessary to process the data. Refer to the README
 * for more specifics.
 * 
 * If no argument is specified, it will enter into interactive mode.
 */

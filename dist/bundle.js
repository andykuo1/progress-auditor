'use strict';

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

var Assignment = /*#__PURE__*/Object.freeze({
    createAssignment: createAssignment
});

const ASSIGNMENT_KEY = 'assignment';
const OUTPUT_LOG = 'db.assignment.log';

function setupDatabase(db)
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

function getAssignmentsByUser(db, userID)
{
    return db[ASSIGNMENT_KEY].get(userID);
}

function outputLog(db, outputDir = '.')
{
    const assignmentMapping = db[ASSIGNMENT_KEY];
    const result = {};
    for(const [key, value] of assignmentMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Assignments\n# Size: ${assignmentMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG), log);
}

var AssignmentDatabase = /*#__PURE__*/Object.freeze({
    ASSIGNMENT_KEY: ASSIGNMENT_KEY,
    setupDatabase: setupDatabase,
    addAssignment: addAssignment,
    getAssignmentByID: getAssignmentByID,
    getAssignmentsByUser: getAssignmentsByUser,
    outputLog: outputLog
});

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
        return getNextSunday(new Date(date.getTime() + 7 * ONE_DAYTIME));
    }
    else
    {
        return getNextSunday(date);
    }
}

function offsetDate(date, offset=0)
{
    const result = new Date(date.getTime());
    if (offset) result.setUTCDate(result.getUTCDate() + offset);
    return result;
}

var DateUtil = /*#__PURE__*/Object.freeze({
    ONE_DAYTIME: ONE_DAYTIME,
    compareDates: compareDates,
    isWithinDates: isWithinDates,
    getDaysBetween: getDaysBetween,
    getPastSunday: getPastSunday,
    getNextSunday: getNextSunday,
    getNextEffectiveSunday: getNextEffectiveSunday,
    offsetDate: offsetDate
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
 * @param {*} userID The id for the user of the vacation.
 * @param {Date} startDate The date the vacation starts from.
 * @param {Date} endDate The date the vacation ends on.
 * @param {String|Number} padding The padding around the vacation days.
 * @param {Object} attributes Any additional information about the vacation.
 * @returns {Object} The vacation data object.
 */
function createVacation(vacationID, userID, startDate, endDate, padding, attributes)
{
    const [newStartDate, newEndDate] = computeDatesWithPadding(padding, startDate, endDate);
    return {
        id: vacationID,
        userID,
        // Dates defined by user. Use this for user-sensitive calculations.
        userStartDate: startDate,
        userEndDate: endDate,
        // Dates with padding accounted for. Use this when determining active work days.
        effectiveStartDate: newStartDate,
        effectiveEndDate: newEndDate,
        padding: padding,
        duration: getDaysBetween(startDate, endDate),
        attributes
    };
}

var Vacation = /*#__PURE__*/Object.freeze({
    createVacation: createVacation
});

const VACATION_KEY = 'vacation';
const OUTPUT_LOG$1 = 'db.vacation.log';

function setupDatabase$1(db)
{
    if (!(VACATION_KEY in db))
    {
        db[VACATION_KEY] = new Map();
    }
    return db;
}

function addVacation(db, vacationID, userID, startDate, endDate=startDate, padding=0, attributes = {})
{
    const vacationMapping = db[VACATION_KEY];

    if (vacationMapping.has(vacationID))
    {
        db.throwError('Found duplicate vacation with id \'' + vacationID + '\'.');
        return null;
    }
    else
    {
        // Create vacation...
        const vacation = createVacation(vacationID, userID, startDate, endDate, padding, attributes);
        vacationMapping.set(vacationID, vacation);
        return vacation;
    }
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

function getVacations(db)
{
    return db[VACATION_KEY].keys();
}

function getVacationByID(db, id)
{
    return db[VACATION_KEY].get(id);
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

function outputLog$1(db, outputDir = '.')
{
    const vacationMapping = db[VACATION_KEY];
    const result = {};
    for(const [key, value] of vacationMapping.entries())
    {
        result[key] = value;
    }

    const header = `${'# '.repeat(20)}\n# Vacations\n# Size: ${vacationMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG$1), log);
}

var VacationDatabase = /*#__PURE__*/Object.freeze({
    VACATION_KEY: VACATION_KEY,
    setupDatabase: setupDatabase$1,
    addVacation: addVacation,
    offsetDateByVacations: offsetDateByVacations,
    getVacations: getVacations,
    getVacationByID: getVacationByID,
    getVacationsByUserID: getVacationsByUserID,
    getVacationsByAttribute: getVacationsByAttribute,
    outputLog: outputLog$1
});

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

var AssignmentGenerator = /*#__PURE__*/Object.freeze({
    assign: assign,
    assignWeekly: assignWeekly
});

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

var Database = /*#__PURE__*/Object.freeze({
    createDatabase: createDatabase
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

const REVIEW_KEY = 'review';
const OUTPUT_LOG$2 = 'db.review.log';

function setupDatabase$2(db)
{
    if (!(REVIEW_KEY in db))
    {
        db[REVIEW_KEY] = new Map();
    }
    return db;
}

function addReview(db, reviewID, reviewDate, comment, type, params)
{
    const reviewMapping = db[REVIEW_KEY];

    if (reviewMapping.has(reviewID))
    {
        db.throwError(REVIEW_KEY, 'Found duplicate ids for reviews', reviewID);
        return null;
    }
    else
    {
        const review = createReview(reviewID, reviewDate, comment, type, params);
        reviewMapping.set(reviewID, review);
        return review;
    }
}

function getReviews(db)
{
    return db[REVIEW_KEY].keys();
}

function getReviewByID(db, reviewID)
{
    return db[REVIEW_KEY].get(reviewID);
}

function outputLog$2(db, outputDir = '.')
{
    const reviewMapping = db[REVIEW_KEY];
    const result = {};
    for(const [key, value] of reviewMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Reviews\n# Size: ${reviewMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG$2), log);
}

var ReviewDatabase = /*#__PURE__*/Object.freeze({
    REVIEW_KEY: REVIEW_KEY,
    setupDatabase: setupDatabase$2,
    addReview: addReview,
    getReviews: getReviews,
    getReviewByID: getReviewByID,
    outputLog: outputLog$2
});

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

const SCHEDULE_KEY = 'schedule';
const OUTPUT_LOG$3 = 'db.schedule.log';

function setupDatabase$3(db)
{
    if (!(SCHEDULE_KEY in db))
    {
        db[SCHEDULE_KEY] = new Map();
    }
    return db;
}

function addSchedule(db, userID, startDate, endDate, attributes={})
{
    const scheduleMapping = db[SCHEDULE_KEY];

    if (scheduleMapping.has(userID))
    {
        db.throwError(SCHEDULE_KEY, 'Found duplicate schedules for user', userId);
        return null;
    }
    else
    {
        const schedule = createSchedule(startDate, endDate, attributes);
        scheduleMapping.set(userID, schedule);
        return schedule;
    }
}

function getScheduleByUserID(db, userID)
{
    return db[SCHEDULE_KEY].get(userID);
}

function outputLog$3(db, outputDir = '.')
{
    const scheduleMapping = db[SCHEDULE_KEY];
    const result = {};
    for(const [key, value] of scheduleMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Schedules\n# Size: ${scheduleMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG$3), log);
}

var ScheduleDatabase = /*#__PURE__*/Object.freeze({
    SCHEDULE_KEY: SCHEDULE_KEY,
    setupDatabase: setupDatabase$3,
    addSchedule: addSchedule,
    getScheduleByUserID: getScheduleByUserID,
    outputLog: outputLog$3
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
const OUTPUT_LOG$4 = 'db.submission.log';

function setupDatabase$4(db)
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
        db.throwError(SUBMISSION_KEY, 'Found duplicate submission with same id', submissionID);
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

function outputLog$4(db, outputDir = '.')
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
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG$4), log);
}

var SubmissionDatabase = /*#__PURE__*/Object.freeze({
    SUBMISSION_KEY: SUBMISSION_KEY,
    SUBMISSION_OWNER_KEY: SUBMISSION_OWNER_KEY,
    SUBMISSION_LIST_KEY: SUBMISSION_LIST_KEY,
    setupDatabase: setupDatabase$4,
    addSubmission: addSubmission,
    addSubmissionToAssignment: addSubmissionToAssignment,
    changeSubmissionAssignment: changeSubmissionAssignment,
    getAssignedSubmissionsByOwnerKey: getAssignedSubmissionsByOwnerKey,
    getSubmissionByID: getSubmissionByID,
    getOwners: getOwners,
    getSubmissions: getSubmissions,
    clearSubmissionsByOwner: clearSubmissionsByOwner,
    removeSubmissionByID: removeSubmissionByID,
    outputLog: outputLog$4
});

/**
 * Creates a user object.
 * @param {*} userID The globally unique user id.
 * @param {*} ownerKey The unique key, or keys, that associates submissions to users. Can be an array if associated with multiple.
 * @param {String} userName The user's name.
 * @param {Object} attributes Any additional information about the user.
 * @returns {Object} The user data object.
 */
function createUser(userID, ownerKey, userName, attributes)
{
    return {
        id: userID,
        ownerKey,
        name: userName,
        attributes
    };
}

var User = /*#__PURE__*/Object.freeze({
    createUser: createUser
});

const USER_KEY = 'user';
const OUTPUT_LOG$5 = 'db.user.log';

function setupDatabase$5(db)
{
    if (!(USER_KEY in db))
    {
        db[USER_KEY] = new Map();
    }
    return db;
}

function addUser(db, userID, ownerKey, userName, attributes = {})
{
    const userMapping = db[USER_KEY];

    if (userMapping.has(userID))
    {
        db.throwError('Found duplicate user with id \'' + userID + '\'.');
        return null;
    }
    else
    {
        // Create user...
        const user = createUser(userID, ownerKey, userName, attributes);
        userMapping.set(userID, user);
        return user;
    }
}

function getUsers(db)
{
    return db[USER_KEY].keys();
}

function getUserByID(db, id)
{
    return db[USER_KEY].get(id);
}

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

function outputLog$5(db, outputDir = '.')
{
    const userMapping = db[USER_KEY];
    const result = {};
    for(const [key, value] of userMapping.entries())
    {
        result[key] = value;
    }

    const header = `${'# '.repeat(20)}\n# Users\n# Size: ${userMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG$5), log);
}

var UserDatabase = /*#__PURE__*/Object.freeze({
    USER_KEY: USER_KEY,
    setupDatabase: setupDatabase$5,
    addUser: addUser,
    getUsers: getUsers,
    getUserByID: getUserByID,
    getUserByOwnerKey: getUserByOwnerKey,
    getUsersByAttribute: getUsersByAttribute,
    outputLog: outputLog$5
});

// TODO: this is still hard-coded...
async function setupDatabase$6(config)
{
    const db = createDatabase();

    // NOTE: User-defined databases...
    setupDatabase$5(db);
    setupDatabase$3(db);
    setupDatabase$4(db);
    setupDatabase(db);
    setupDatabase$2(db);
    setupDatabase$1(db);

    return db;
}

var DatabaseSetup = /*#__PURE__*/Object.freeze({
    setupDatabase: setupDatabase$6
});

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

var AssignmentLoader = /*#__PURE__*/Object.freeze({
    loadAssignments: loadAssignments
});

const fs = require('fs');
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

var FileUtil = /*#__PURE__*/Object.freeze({
    readJSONFile: readJSONFile,
    readCSVFileByRow: readCSVFileByRow,
    readFileByLine: readFileByLine,
    writeToFile: writeToFile,
    writeTableToCSV: writeTableToCSV
});

const path = require('path');
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

var ConfigLoader = /*#__PURE__*/Object.freeze({
    loadConfig: loadConfig
});

const path$1 = require('path');

async function loadDatabase(db, config)
{
    if (!('parsers' in config))
    {
        console.log('......No parsers found...');
        return Promise.resolve([]);
    }
    
    const inputParentPath = config.inputPath || '.';
    const parserResults = [];
    for(const parserConfig of config.parsers)
    {
        const filePath = parserConfig.filePath;
        const inputFile = parserConfig.inputFile;
        console.log(inputFile, inputParentPath);
        if (!inputFile) db.throwError('Invalid config - missing input file for parser');

        const inputPath = path$1.resolve(inputParentPath, parserConfig.inputFile);
        const parser = require(filePath);

        console.log(`......Parsing '${path$1.basename(parserConfig.inputFile)}' with '${path$1.basename(parserConfig.filePath)}'...`);
        parserResults.push(parser.parse(db, inputPath, parserConfig.opts));
    }

    return Promise.all(parserResults);
}

var DatabaseLoader = /*#__PURE__*/Object.freeze({
    loadDatabase: loadDatabase
});

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

var ReviewProcessor = /*#__PURE__*/Object.freeze({
    processReviews: processReviews
});

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

var DatabaseProcessor = /*#__PURE__*/Object.freeze({
    processDatabase: processDatabase
});

const path$4 = require('path');

async function output(db, outputPath, config)
{
    // Output all database logs...
    outputLog$5(db, outputPath);
    outputLog$3(db, outputPath);
    outputLog$4(db, outputPath);
    outputLog(db, outputPath);
    outputLog$2(db, outputPath);
    outputLog$1(db, outputPath);

    // Output computed config file...
    writeToFile(path$4.resolve(outputPath, 'config.log'), JSON.stringify(config, null, 4));

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
    writeToFile(path$4.resolve(outputPath, 'errors.txt'), output);
}

var DebugInfoOutput = /*#__PURE__*/Object.freeze({
    output: output
});

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

const path$5 = require('path');

async function output$1(db, outputPath, config)
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
    writeTableToCSV(path$5.resolve(outputPath, 'slip-days.csv'), outputTable);
}

var ReportOutput = /*#__PURE__*/Object.freeze({
    output: output$1
});

const readline$1 = require('readline');

const readlineInterface = readline$1.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function question(message)
{
    return new Promise((resolve, reject) => {
        readlineInterface.on('close', reject);
        readlineInterface.question(message, resolve);
    });
}

async function quit()
{
    readlineInterface.close();
}

var ConsoleHelper = /*#__PURE__*/Object.freeze({
    question: question,
    quit: quit
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
 * Generates a uuidv4.
 * 
 * @returns {String} the universally unique id
 */
function uuid()
{
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

var MathHelper = /*#__PURE__*/Object.freeze({
    stringHash: stringHash,
    uuid: uuid
});

function parseDate(value)
{
    // 2018-06-10 06:20:30 UTC
    const result = new Date(1000);

    const year = Number(value.substring(0, 4));
    const month = Number(value.substring(5, 7));
    const day = Number(value.substring(8, 10));

    const hour = Number(value.substring(11, 13));
    const minute = Number(value.substring(14, 16));
    const second = Number(value.substring(17, 19));

    if (year === NaN || month === NaN || day === NaN || hour === NaN || minute === NaN || second === NaN) throw new Error('Invalid date format - should be YYYY-MM-DD HH:MM:SS.');

    result.setUTCFullYear(year);
    result.setUTCMonth(month - 1);
    result.setUTCDate(day);
    result.setUTCHours(hour);
    result.setUTCMinutes(minute);
    result.setUTCSeconds(second);

    return result;
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

var ParseUtil = /*#__PURE__*/Object.freeze({
    parseDate: parseDate,
    parseAmericanDate: parseAmericanDate
});

// database
const DATABASE_EXPORTS = {
    Assignment,
    AssignmentDatabase,
    AssignmentGenerator,
    Database,
    Review,
    ReviewDatabase,
    Schedule,
    ScheduleDatabase,
    Submission,
    SubmissionDatabase,
    User,
    UserDatabase,
    Vacation,
    VacationDatabase
};
const PIPELINE_EXPORTS = {
    DatabaseSetup,
    AssignmentLoader,
    ConfigLoader,
    DatabaseLoader,
    ReviewProcessor,
    DatabaseProcessor,
    DebugInfoOutput,
    ReportOutput
};
const UTIL_EXPORTS = {
    ConsoleHelper,
    DateUtil,
    FieldParser,
    FileUtil,
    MathHelper,
    ParseUtil,
    TableBuilder
};

const EXPORTS = {
    ...DATABASE_EXPORTS,
    ...PIPELINE_EXPORTS,
    ...UTIL_EXPORTS
};

/*
function setupModuleRequire()
{
    const Module = require('module');
    const ModuleRequire = Module.prototype.require;
    
    Module.prototype.require = function(filepath) {
        if (filepath === 'main')
        {
            return EXPORTS;
        }
        return ModuleRequire.apply(this, arguments);
    };
}
*/

async function run(configPath = './config.json')
{
    // Declare Library as global variable.
    global.Library = EXPORTS;

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
        await output(db, config.outputPath);

        console.log("...Failed!");
    }
    else
    {
        console.log("......Hooray! Everything is as expected...");

        if (config.debug)
        {
            console.log("......Finding debug info for you...");
            await output(db, config.outputPath);
        }

        console.log("......Generating reports for you...");
        await output$1(db, config.outputPath);

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

// Start it.
run();

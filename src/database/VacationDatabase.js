const Vacation = require('./Vacation.js');
const { isWithinDates, getDaysBetween } = require('../util/DateUtil.js');

const VACATION_KEY = 'vacation';
const OUTPUT_LOG = 'db.vacation.log';

function setupDatabase(db)
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
        const vacation = Vacation.createVacation(vacationID, userID, startDate, endDate, padding, attributes);
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
            const days = getDaysBetween(vacation.effectiveStartDate, result);
            result.setUTCDate(vacation.effectiveEndDate.getUTCDate() + days);
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

function outputLog(db, outputDir = '.')
{
    const vacationMapping = db[VACATION_KEY];
    const result = {};
    for(const [key, value] of vacationMapping.entries())
    {
        result[key] = value;
    }

    const header = `${'# '.repeat(20)}\n# Vacations\n# Size: ${vacationMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG), log);
}

module.exports = {
    VACATION_KEY,
    setupDatabase,
    addVacation,
    offsetDateByVacations,
    getVacations,
    getVacationByID,
    getVacationsByUserID,
    getVacationsByAttribute,
    outputLog,
};
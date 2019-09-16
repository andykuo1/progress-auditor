import * as Vacation from './Vacation.js';
import { ONE_DAYTIME, isWithinDates, getDaysUntil } from '../util/DateUtil.js';

export const VACATION_KEY = 'vacation';
const OUTPUT_LOG = 'db.vacation.log';

export function setupDatabase(db)
{
    if (!(VACATION_KEY in db))
    {
        db[VACATION_KEY] = new Map();
    }
    return db;
}

export function clearDatabase(db)
{
    if (VACATION_KEY in db)
    {
        db[VACATION_KEY].clear();
    }
    return db;
}

export function addVacation(db, vacationID, ownerKey, startDate, endDate=startDate, padding=0, attributes = {})
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
        const vacation = Vacation.createVacation(vacationID, ownerKey, startDate, endDate, padding, attributes);
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
export function offsetDateByVacations(db, ownerKeys, date)
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

export function getVacations(db)
{
    return db[VACATION_KEY].keys();
}

export function getVacationByID(db, id)
{
    return db[VACATION_KEY].get(id);
}

/**
 * Finds all vacations belonging to the passed-in owners.
 * @param {Database} db The database to add vacations to.
 * @param {Array<String>} ownerKeys The owner keys.
 * @returns {Array} The vacations associated to the owner keys.
 */
export function getVacationsByOwnerKeys(db, ownerKeys)
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

export function getVacationsByAttribute(db, attributeName, attributeValue)
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

export function outputLog(db, outputFunction, outputDir = '.')
{
    const vacationMapping = db[VACATION_KEY];
    const result = {};
    for(const [key, value] of vacationMapping.entries())
    {
        result[key] = value;
    }

    const header = `${'# '.repeat(20)}\n# Vacations\n# Size: ${vacationMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    outputFunction(require('path').resolve(outputDir, OUTPUT_LOG), log);
}

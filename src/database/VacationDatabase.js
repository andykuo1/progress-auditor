const Vacation = require('./Vacation.js');

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

function addVacation(db, vacationID, ownerKey, startDate, endDate=startDate, padding=0, attributes = {})
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
        const vacation = Vacation.createVacation(vacationID, ownerKey, startDate, endDate, padding, attributes);
        vacationMapping.set(vacationID, vacation);
        return vacation;
    }
}

function getVacations(db)
{
    return db[VACATION_KEY].keys();
}

function getVacationByID(db, id)
{
    return db[VACATION_KEY].get(id);
}

function getVacationByOwnerKey(db, ownerKey)
{
    const vacationMapping = db[VACATION_KEY];
    for(const vacationData of vacationMapping.values())
    {
        if (Array.isArray(vacationData.ownerKey))
        {
            if (vacationData.ownerKey.includes(ownerKey))
            {
                return vacationData.id;
            }
        }
        else if (vacationData.ownerKey == ownerKey)
        {
            return vacationData.id;
        }
    }
    return null;
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
    getVacations,
    getVacationByID,
    getVacationByOwnerKey,
    getVacationsByAttribute,
    outputLog,
};
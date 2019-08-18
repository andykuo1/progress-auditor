import * as Schedule from './Schedule.js';

export const SCHEDULE_KEY = 'schedule';
const OUTPUT_LOG = 'db.schedule.log';

export function setupDatabase(db)
{
    if (!(SCHEDULE_KEY in db))
    {
        db[SCHEDULE_KEY] = new Map();
    }
    return db;
}

export function clearDatabase(db)
{
    if (SCHEDULE_KEY in db)
    {
        delete db[SCHEDULE_KEY];
    }
    return db;
}

export function addSchedule(db, userID, startDate, endDate, attributes={})
{
    const scheduleMapping = db[SCHEDULE_KEY];

    if (scheduleMapping.has(userID))
    {
        db.throwError(SCHEDULE_KEY, 'Found duplicate schedules for user', userId);
        return null;
    }
    else
    {
        const schedule = Schedule.createSchedule(startDate, endDate, attributes);
        scheduleMapping.set(userID, schedule);
        return schedule;
    }
}

export function getScheduleByUserID(db, userID)
{
    return db[SCHEDULE_KEY].get(userID);
}

export function outputLog(db, outputDir = '.')
{
    const scheduleMapping = db[SCHEDULE_KEY];
    const result = {};
    for(const [key, value] of scheduleMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Schedules\n# Size: ${scheduleMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG), log);
}

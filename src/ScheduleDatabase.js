const Schedule = require('./Schedule.js');

const SCHEDULE_KEY = 'schedule';

function setupDatabase(db)
{
    db[SCHEDULE_KEY] = new Map();
}

function addSchedule(db, userID, startDate, endDate, opts={})
{
    const scheduleMapping = db[SCHEDULE_KEY];

    if (scheduleMapping.has(userID))
    {
        db.throwError(SCHEDULE_KEY, 'Found duplicate schedules for user', userId);
    }
    else
    {
        const schedule = Schedule.createSchedule(startDate, endDate, opts);
        scheduleMapping.set(userID, schedule);
    }
}

module.exports = {
    SCHEDULE_KEY,
    setupDatabase,
    addSchedule
};
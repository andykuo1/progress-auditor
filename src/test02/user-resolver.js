const path = require('path');
const Database = require('../Database.js');
const UserDatabase = require('../UserDatabase.js');
const ScheduleDatabase = require('../ScheduleDatabase.js');

const cohortParser = require('./cohort-parser.js');

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const INPUT_DIR = path.resolve(__dirname, '__TEST__/in/');
const OUTPUT_DIR = path.resolve(__dirname, '__TEST__/out/');

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

async function main()
{
    const db = Database.createDatabase();

    await cohortParser.parse(path.resolve(INPUT_DIR, 'cohort.csv'), db);

    UserDatabase.outputLog(db, OUTPUT_DIR);
    ScheduleDatabase.outputLog(db, OUTPUT_DIR);
}

main();

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
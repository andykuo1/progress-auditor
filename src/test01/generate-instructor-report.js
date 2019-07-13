const { writeTableToCSV } = require('../FileUtil.js');
const contributionsParser = require('./csv-contributions-parser.js');
const cohortsParser = require('./csv-cohorts-parser.js');
const Database = require('../Database.js');

const OUTPUT_PATH = './out/slip-days.csv';
main();

async function main()
{
    const db = Database.createDatabase();
    await contributionsParser.parse('./out/test01/contributions.csv', db);
    await cohortsParser.parse('./out/test01/cohorts.csv', db);
    
    processContributions(db);
    generateInstructorReport(db);
}

function processContributions(db)
{
    console.log(db);
}

function generateInstructorReport(db)
{
    const table = [];
    writeTableToCSV(OUTPUT_PATH, table);
}

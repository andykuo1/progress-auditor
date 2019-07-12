const { writeTableToCSV } = require('./fileutil.js');
const parser = require('./parser/csv-contributions-parser.js');

const db = {};
parser.parse('./out/contributions.csv', db);
generateInstructorReport(db);

function generateInstructorReport(db)
{
    
}

const path = require('path');
const UserDatabase = require('../../database/UserDatabase.js');
const ScheduleDatabase = require('../../database/ScheduleDatabase.js');
const SubmissionDatabase = require('../../database/SubmissionDatabase.js');
const AssignmentDatabase = require('../../database/AssignmentDatabase.js');
const ReviewDatabase = require('../../database/ReviewDatabase.js');
const VacationDatabase = require('../../database/VacationDatabase.js');
const { writeToFile } = require('../../util/FileUtil.js');

async function output(db, config)
{
    const OUTPUT_DIR = './src/__TEST__/out/';

    // Output all database logs...
    UserDatabase.outputLog(db, OUTPUT_DIR);
    ScheduleDatabase.outputLog(db, OUTPUT_DIR);
    SubmissionDatabase.outputLog(db, OUTPUT_DIR);
    AssignmentDatabase.outputLog(db, OUTPUT_DIR);
    ReviewDatabase.outputLog(db, OUTPUT_DIR);
    VacationDatabase.outputLog(db, OUTPUT_DIR);

    // Output computed config file...
    writeToFile(path.resolve(OUTPUT_DIR, 'config.log'), JSON.stringify(config, null, 4));

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
    writeToFile(path.resolve(OUTPUT_DIR, 'errors.txt'), output);
}

module.exports = {
    output
};
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
    const outputDir = config.outputPath;

    // Output all database logs...
    UserDatabase.outputLog(db, outputDir);
    ScheduleDatabase.outputLog(db, outputDir);
    SubmissionDatabase.outputLog(db, outputDir);
    AssignmentDatabase.outputLog(db, outputDir);
    ReviewDatabase.outputLog(db, outputDir);
    VacationDatabase.outputLog(db, outputDir);

    // Output computed config file...
    writeToFile(path.resolve(outputDir, 'config.log'), JSON.stringify(config, null, 4));

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
    writeToFile(path.resolve(outputDir, 'errors.txt'), output);
}

module.exports = {
    output
};
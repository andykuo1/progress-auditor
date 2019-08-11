import * as UserDatabase from '../../database/UserDatabase.js';
import * as ScheduleDatabase from '../../database/ScheduleDatabase.js';
import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';
import * as AssignmentDatabase from '../../database/AssignmentDatabase.js';
import * as ReviewDatabase from '../../database/ReviewDatabase.js';
import * as VacationDatabase from '../../database/VacationDatabase.js';
import { writeToFile } from '../../util/FileUtil.js';

const path = require('path');

export async function output(db, outputPath, config)
{
    // Output all database logs...
    UserDatabase.outputLog(db, outputPath);
    ScheduleDatabase.outputLog(db, outputPath);
    SubmissionDatabase.outputLog(db, outputPath);
    AssignmentDatabase.outputLog(db, outputPath);
    ReviewDatabase.outputLog(db, outputPath);
    VacationDatabase.outputLog(db, outputPath);

    // Output computed config file...
    writeToFile(path.resolve(outputPath, 'config.log'), JSON.stringify(config, null, 4));

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
    writeToFile(path.resolve(outputPath, 'errors.txt'), output);
}

import * as UserDatabase from '../database/UserDatabase.js';
import * as SubmissionDatabase from '../database/SubmissionDatabase.js';
import * as AssignmentDatabase from '../database/AssignmentDatabase.js';
import * as ReviewDatabase from '../database/ReviewDatabase.js';
import * as VacationDatabase from '../database/VacationDatabase.js';
import * as FileUtil from '../util/FileUtil.js';

const path = require('path');

export async function output(db, config, outputPath, opts)
{
    // Output all database logs...
    try { UserDatabase.outputLog(db, outputPath); }
    catch(e) { console.error('Failed to output log.', e); }
    try { SubmissionDatabase.outputLog(db, outputPath); }
    catch(e) { console.error('Failed to output log.', e); }
    try { AssignmentDatabase.outputLog(db, outputPath); }
    catch(e) { console.error('Failed to output log.', e); }
    try { ReviewDatabase.outputLog(db, outputPath); }
    catch(e) { console.error('Failed to output log.', e); }
    try { VacationDatabase.outputLog(db, outputPath); }
    catch(e) { console.error('Failed to output log.', e); }

    // Output computed config file...
    FileUtil.writeToFile(path.resolve(outputPath, 'config.log'), JSON.stringify(config, null, 4));

    // Output error list...
    let output;
    if (db.getErrors().length <= 0)
    {
        output = "HOORAY! No errors!";
    }
    else
    {
        let errors = [];
        for(const error of db.getErrors())
        {
            errors.push(`${error.id}: [${error.tag}] ${error.message}\n=== SOLUTIONS: ===\n => ${error.options.join('\n => ')}\n=== MOREINFO: ===\n${error.more.join('\n')}\n`);
        }
        output = "It's okay. We'll get through this.\n\n" + errors.join('\n');
    }
    FileUtil.writeToFile(path.resolve(outputPath, 'errors.txt'), output);
}

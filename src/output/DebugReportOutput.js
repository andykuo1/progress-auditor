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
    const outputFunction = FileUtil.writeToFile;
    try { await UserDatabase.outputLog(db, outputFunction, outputPath); }
    catch(e) { console.error('Failed to output log.'); }
    try { await SubmissionDatabase.outputLog(db, outputFunction, outputPath); }
    catch(e) { console.error('Failed to output log.'); }
    try { await AssignmentDatabase.outputLog(db, outputFunction, outputPath); }
    catch(e) { console.error('Failed to output log.'); }
    try { await ReviewDatabase.outputLog(db, outputFunction, outputPath); }
    catch(e) { console.error('Failed to output log.'); }
    try { await VacationDatabase.outputLog(db, outputFunction, outputPath); }
    catch(e) { console.error('Failed to output log.'); }

    // Output computed config file...
    try { await FileUtil.writeToFile(path.resolve(outputPath, 'config.log'), JSON.stringify(config, null, 4)); }
    catch(e) { console.error('Failed to output config log.'); }

    // Output error list...
    try
    {
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
        await FileUtil.writeToFile(path.resolve(outputPath, 'errors.txt'), output);
    }
    catch(e) { console.error('Failed to output error log.'); }

    // Output database cache...
    try
    {
        const output = JSON.stringify(db.getCache(), null, 4);
        await FileUtil.writeToFile(path.resolve(outputPath, 'cache.txt'), output);
    }
    catch(e) { console.error('Failed to output cache log.'); }
}

import * as InstructorReportOutput from '../../lib/output/InstructorReportOutput.js';
import * as StudentReportOutput from '../../lib/output/StudentReportOutput.js';

const path = require('path');

export async function processOutput(db, config)
{
    // Process outputs...
    console.log("......Generating reports for you...");

    const opts = {};
    //console.log(`.........Outputting with '${path.basename(outputConfig.filePath)}'...`);
    return Promise.all([
        InstructorReportOutput.output(db, config.outputPath, opts),
        StudentReportOutput.output(db, config.outputPath, opts),
    ]);
}

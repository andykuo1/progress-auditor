const path = require('path');

export async function processOutput(db, config)
{
    // Process outputs...
    console.log("......Generating reports for you...");

    const outputResults = [];
    for(const outputConfig of config.outputs)
    {
        const filePath = outputConfig.filePath;
        const output = require(filePath);

        console.log(`.........Outputting with '${path.basename(outputConfig.filePath)}'...`);
        outputResults.push(output.output(db, config.outputPath, outputConfig.opts));
    }

    return Promise.all(outputResults);
}

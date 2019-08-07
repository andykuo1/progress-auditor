const path = require('path');

export async function loadDatabase(db, config)
{
    if (!('parsers' in config))
    {
        console.log('......No parsers found...');
        return Promise.resolve([]);
    }
    
    const parserResults = [];
    for(const parserConfig of config.parsers)
    {
        const filePath = parserConfig.filePath;
        const inputPath = parserConfig.inputPath;
        const parser = require(filePath);

        console.log(`......Parsing '${path.basename(parserConfig.inputPath)}' with '${path.basename(parserConfig.filePath)}'...`);
        parserResults.push(parser.parse(db, inputPath, parserConfig.opts));
    }

    return Promise.all(parserResults);
}

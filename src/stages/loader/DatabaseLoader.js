const path = require('path');

export async function loadDatabase(db, config)
{
    if (!('parsers' in config))
    {
        console.log('......No parsers found...');
        return Promise.resolve([]);
    }
    
    const inputParentPath = config.inputPath || '.';
    const parserResults = [];
    for(const parserConfig of config.parsers)
    {
        const filePath = parserConfig.filePath;
        const inputFile = parserConfig.inputFile;
        if (!inputFile)
        {
            db.throwError('Invalid config - missing input file for parser');
            continue;
        }

        const inputPath = path.resolve(inputParentPath, parserConfig.inputFile);
        const parser = require(filePath);

        console.log(`......Parsing '${path.basename(parserConfig.inputFile)}' with '${path.basename(parserConfig.filePath)}'...`);
        parserResults.push(parser.parse(db, inputPath, parserConfig.opts));
    }

    return Promise.all(parserResults);
}

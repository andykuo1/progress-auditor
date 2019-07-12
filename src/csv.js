const fileutil = require('./fileutil.js');

async function readCSVToTable(filepath)
{
    let result = [];
    await readFileByLine(filepath, (line) => {
        result.push(line.split(','));
    });
    return result;
}
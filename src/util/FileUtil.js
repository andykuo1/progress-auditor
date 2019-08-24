const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Papa = require('papaparse');

export function readJSONFile(filepath)
{
    const data = fs.readFileSync(filepath);
    return JSON.parse(data);
}

/**
 * Reads a csv file asynchronously and processes the file by row.
 * @param {String} filepath The file path to the file to be read.
 * @param {Function} callback The callback function to process the row read.
 */
export function readCSVFileByRow(filepath, callback)
{
    return new Promise((resolve, reject) => {
        const input = fs.createReadStream(filepath);
        Papa.parse(input, {
            step: (row) => callback(row.data),
            complete: resolve,
            error: reject
        });

    });
}

/**
 * Reads a file asynchronously and processes the file by line.
 * @param {String} filepath The file path to the file to be read.
 * @param {Function} callback The callback function to process the line read.
 */
export function readFileByLine(filepath, callback)
{
    return new Promise((resolve, reject) => {
        const input = fs.createReadStream(filepath);
        const rd = readline.createInterface({ input });
        input.on('error', (e) => {
            console.error(e);
            reject(e);
        });
        rd.on('line', callback);
        rd.on('close', () => {
            resolve();
        });
    });
}

// TODO: Temporary hack for writing files, NOT ASYNC!
export function writeToFile(filepath, content)
{
    fs.mkdirSync(path.basename(filepath), { recursive: true });
    fs.writeFile(filepath, content, function(err) {
        if (err)
        {
            return console.log(err);
        }

        console.log("File saved:", filepath);
    }); 
}

export function writeTableToCSV(filepath, table)
{
    writeToFile(filepath, table.map(e => e.join(',')).join('\n'));
}

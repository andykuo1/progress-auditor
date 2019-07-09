const { printTable } = require('./output/console.js');

function generateInstructorReport()
{
    const table = [
        ['Andrew', 'PASS', 'INCOMP(-1)', '_', '', '3/4'],
        ['Cookies', 'INCOMP(-2)', '_', '', '', '2/4'],
        ['Pancakes', 'PASS(-1)', 'PASS', '_', '', '3/4'],
        ['Waffles', 'PASS(-3)', 'PASS(-4?)', '_', '', '-3/4'],
    ];

    const COL_HEADERS = ['Name', 'W0', 'W1', 'W2', 'W3', 'Slips'];

    printTable(table, COL_HEADERS);
}

generateInstructorReport();
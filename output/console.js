function divider(length, token='-')
{
    const remainder = length % token.length;
    const remainderString = token.substring(0, remainder);
    return token.repeat(Math.floor(length / token.length)) + remainderString;
}

function formatRow(row, cellWidth, header = undefined, headerPadToken = ' ', cellPadToken = ' ')
{
    const length = row.length;
    const result = [];

    // Row header
    if (typeof header !== 'undefined')
    {
        result.push(formatCell(header, cellWidth, headerPadToken));
    }

    // Data
    for(let i = 0; i < length; ++i)
    {
        result.push(formatCell(row[i], cellWidth, cellPadToken));
    }

    return result.join('|');
}

function formatCell(content, cellWidth, padToken = ' ')
{
    const contentString = String(content);
    if (contentString.length > cellWidth)
    {
        return contentString.substring(0, cellWidth);
    }
    else
    {
        return contentString.padEnd(cellWidth, padToken);
    }
}

function printDivider(rowWidth=12, dividerToken='-')
{
    printRow(divider(rowWidth, dividerToken), rowWidth,  dividerToken);
}

function printRow(content, rowWidth=12, rowHeight=1, padToken=' ')
{
    if (content.length > rowWidth && (rowHeight > 1 || rowHeight < 0))
    {
        printRow(content.substring(0, rowWidth), rowWidth, rowHeight, padToken);
    }
    else
    {
        console.log('|' + padToken + content.padEnd(rowWidth, padToken) + padToken + '|');
    }
}

function printColumn(content, rowWidth=12, padToken=' ')
{
    for(const row of content)
    {
        printRow(row, rowWidth, padToken);
    }
}

function printTable(tableData, colHeader, rowHeader, cellWidth = 8)
{
    let DIVIDER;
    if (colHeader)
    {
        const COL_HEADER_STRING = formatRow(colHeader, cellWidth, rowHeader ? '' : undefined, ' ', ' .');
        DIVIDER = divider(COL_HEADER_STRING.length);
        console.log(`|${DIVIDER}|`);
        console.log(`|${COL_HEADER_STRING}|`);
        console.log(`|${DIVIDER}|`);
    }
    for(let i = 0; i < tableData.length; ++i)
    {
        const row = tableData[i];
        const rowString = formatRow(row, cellWidth, rowHeader ? rowHeader[i] : undefined, ' .');
        if (typeof DIVIDER !== 'string')
        {
            DIVIDER = divider(rowString.length);
        }
        console.log(`|${rowString}|`);
        console.log(`|${DIVIDER}|`);
    }
}

module.exports = {
    printDivider,
    printRow,
    printColumn,
    printTable
};
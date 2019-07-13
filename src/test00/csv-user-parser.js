const { readFileByLine } = require('../fileutil.js');

function parseDate(dateString)
{
    const dateArray = dateString.split('/');
    return new Date(
        Number(dateArray[2]),       // Year
        Number(dateArray[0]) - 1,   // Month Index (starts from 0)
        Number(dateArray[1])        // Day of the Month
    ).toString();
}

module.exports = {
    async parse(filepath, db)
    {
        const users = [];
        await readFileByLine(filepath, (line) => {
            const cols = line.split(',');
            const email = cols[1];
            const name = cols[2] + ',' + cols[3];
            const startDate = parseDate(cols[10] || '');
            const endDate = parseDate(cols[11] || '');
            users.push([
                email,
                startDate,
                endDate
            ]);
        });
        db.users = users;
    },
    async compose(db, filepath)
    {
        // TODO: Implement this to allow for editable capabilities...
        throw new Error('Unsupported operation');
    }
};
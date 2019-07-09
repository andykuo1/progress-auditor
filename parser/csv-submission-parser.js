const { readFileByLine } = require('../fileutil.js');

module.exports = {
    async parse(filepath, db)
    {
        await readFileByLine(filepath, (line) => {
            const cols = line.split(',');
            const userID = cols[0];
            const submissionID = cols[1];
            const submitDate = cols[2];
            const content = cols[3];
            db.addSubmission(userID, submissionID, submitDate, content);
        });
    },
    async compose(db, filepath)
    {
        // TODO: Implement this to allow for editable capabilities...
        throw new Error('Unsupported operation');
    }
};
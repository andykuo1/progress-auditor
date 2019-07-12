const { readFileByLine } = require('../fileutil.js');

function readName(value)
{

}

function readDate(value)
{

}

function readEmail(value)
{
    
}

module.exports = {
    async parse(filepath, db)
    {
        const result = [];
        await readFileByLine(filepath, (line) => {
            const cols = line.split(',');
            const submissionID = cols[0];
            const reviewDate = cols[1];
            const reviewResult = cols[2];
            const reviewComment = cols[3];
            db.addSubmissionReview(submissionID, reviewDate, reviewResult, reviewComment);
        });
    },
    async compose(db, filepath)
    {
        // TODO: Implement this to allow for editable capabilities...
        throw new Error('Unsupported operation');
    }
};
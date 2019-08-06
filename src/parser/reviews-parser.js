const { readCSVFileByRow } = require('../util/FileUtil.js');
const { parseDate } = require('../util/ParseUtil.js');
const ReviewDatabase = require('../database/ReviewDatabase.js');

/**
 * Create ReviewDatabase based on input file.
 * @param {Database} db The database to write to.
 * @param {String} filepath The path to the file to parse.
 * @param {Object} opts Any additional options.
 */
async function parse(db, filepath, opts={})
{
    ReviewDatabase.setupDatabase(db);

    let first = true;
    await readCSVFileByRow(filepath, (row) => {
        // Skip header...
        if (first) { first = false; return; }

        // 0. Review ID
        // 1. Review Date
        // 2. Comments
        // 3. Review Type
        // 4. Param[0]
        // 5. Param[1]
        // 6. Param[2]
        // ...
        try
        {
            const reviewID = row[0];
            const reviewDate = parseDate(row[1]);
            const comments = row[2];
            const reviewType = row[3];
            const params = [];
            for(let i = 4; i < row.length; ++i)
            {
                if (row[i].length <= 0) break;
                params.push(row[i]);
            }

            const review = ReviewDatabase.addReview(db, reviewID, reviewDate, comments, reviewType, params);
        }
        catch(e)
        {
            db.throwError(ReviewDatabase.REVIEW_KEY, 'Unable to parse review.', e);
        }
    });

    return db;
}

module.exports = {
    parse
};
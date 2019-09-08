import * as ReviewDatabase from '../../database/ReviewDatabase.js';
import * as FileUtil from '../../util/FileUtil.js';
import * as ParseUtil from '../../util/ParseUtil.js';

/**
 * Create ReviewDatabase based on input file.
 * @param {Database} db The database to write to.
 * @param {String} filepath The path to the file to parse.
 * @param {Object} opts Any additional options.
 */
export async function parse(db, config, filepath, opts={})
{
    ReviewDatabase.setupDatabase(db);

    let first = true;
    await FileUtil.readCSVFileByRow(filepath, (row) => {
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
            const reviewDate = ParseUtil.parseDate(row[1]);
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
            db.throwError('PARSE', 'Unable to parse reviews - ' + e);
        }
    });

    return db;
}

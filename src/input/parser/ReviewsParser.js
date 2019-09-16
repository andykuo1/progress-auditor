import * as ReviewDatabase from '../../database/ReviewDatabase.js';
import * as FileUtil from '../../util/FileUtil.js';
import * as DateUtil from '../../util/DateUtil.js';

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
            let reviewDate;
            try
            {
                reviewDate = DateUtil.parse(row[1]);
            }
            catch(e)
            {
                reviewDate = new Date(Date.now());
            }
            const comments = row[2];
            const reviewType = row[3];
            const params = [];

            // Skip the initial stuff and iterate only over the infinite parameters... until an empty cell.
            for(let i = 4; i < row.length; ++i)
            {
                const param = row[i].trim();
                if (param.length <= 0) break;
                params.push(param);
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

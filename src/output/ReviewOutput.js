import * as ReviewDatabase from '../database/ReviewDatabase.js';
import * as SkipErrorReview from '../review/base/SkipErrorReview.js';
import * as FileUtil from '../util/FileUtil.js';
import * as DateUtil from '../util/DateUtil.js';

export async function output(db, config, outputPath, opts)
{
    const reviewTableHeader = [
        'Review ID',
        'Date',
        'Comment',
        'Type',
        'Param[0]',
        'Param[1]',
        'Param[2]',
        'Param[3]',
        '...'
    ];
    const reviewTable = [reviewTableHeader];

    // Append ALL reviews (including new ones)
    for(const reviewID of ReviewDatabase.getReviews(db))
    {
        const review = ReviewDatabase.getReviewByID(db, reviewID);
        const reviewEntry = [];

        // Don't save skipped errors...
        if (review.type === SkipErrorReview.TYPE) continue;

        // ID
        reviewEntry.push(reviewID);
        // Date
        reviewEntry.push(DateUtil.stringify(review.date));
        // Comment
        reviewEntry.push(review.comment);
        // Type
        reviewEntry.push(review.type);
        // Params
        reviewEntry.push(...review.params);

        // Add to table...
        reviewTable.push(reviewEntry);
    }

    await FileUtil.writeTableToCSV(outputPath, reviewTable);
}

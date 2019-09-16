import * as ReviewDatabase from '../../database/ReviewDatabase.js';
import * as VacationDatabase from '../../database/VacationDatabase.js';
import * as DateUtil from '../../util/DateUtil.js';
import * as FieldParser from '../../util/FieldParser.js';
import { stringHash } from '../../util/MathHelper.js';

import * as IgnoreReview from './IgnoreReview.js';

import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'add_vacation';
export const DESCRIPTION = 'Add a vacation to the user\'s schedule';

/**
 * Although this is not a "reflection" review, it does require to be BEFORE assignment data loading.
 * Since data loading is processed BEFORE all reviews, it makes it first. This causes issues with
 * other reflection reviews, therefore all reflection reviews are also processed here.
 */
export async function review(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE)
            .paramLength(3)
            .forEach(value =>
            {
                // NOTE: Because VacationReview is EXPECTED to be called
                // BEFORE all other reviews and any reviews that need "reflection"
                // must run first, those reviews must be applied in 2 places:
                // - Before all the other review types
                // - And during VacationReview
                
                const { id, params } = value;

                // NOTE: So far, only IgnoreReview requires this.
                let ignore = false;
                for(const reviewID of ReviewDatabase.getReviews(db))
                {
                    const review = ReviewDatabase.getReviewByID(db, reviewID);
                    if (review.type === IgnoreReview.TYPE && review.params.length >= 1 && review.params[0] == id)
                    {
                        // This vacation review is ignored.
                        ignore = true;
                        break;
                    }
                }
                if (ignore) return;

                // Back to your regularly scheduled program...
                const ownerKey = FieldParser.parseEmail(params[0]);
                const startDate = DateUtil.parse(params[1]);
                const endDate = DateUtil.parse(params[2]);

                let vacationID;
                if (params.length > 3)
                {
                    vacationID = params[3];
                }
                else
                {
                    vacationID = stringHash(params.join('|'));
                }
    
                // TODO: Vacation padding should be specified at top level or by assignment
                VacationDatabase.addVacation(db, vacationID, ownerKey, startDate, endDate, 'week');
            })
            .review(db, config);
    }
    catch(e)
    {
        db.throwError(ERROR_TAG, e);
    }
}

export async function build(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep(error));
    }
    return result;
}

async function buildStep(error)
{
    return await createBuilder()
        .type(TYPE)
        .param(0, 'Owner Key', 'The target owner to have the vacation.')
        .param(1, 'Start Date', 'The start date of the vacation.')
        .param(2, 'End Date', 'The end date of the vacation.')
        .param(3, '[Vacation ID]', 'The globally-unique id for the vacation. By default, this will be auto-generated.')
        .build();
}

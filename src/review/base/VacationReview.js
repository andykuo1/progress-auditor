import * as VacationDatabase from '../../database/VacationDatabase.js';
import * as DateUtil from '../../util/DateUtil.js';
import * as FieldParser from '../../util/FieldParser.js';
import { stringHash } from '../../util/MathHelper.js';

import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'add_vacation';
export const DESCRIPTION = 'Add a vacation to the user\'s schedule';

export async function review(db, config, reviewDatabase)
{
    try
    {
        await createReviewer(reviewDatabase)
            .type(TYPE)
            .paramLength(3)
            .forEach(value =>
            {
                const { params } = value;

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
            .review();
    }
    catch(e)
    {
        db.throwError(ERROR_TAG, e);
    }
}

export async function build(db, config)
{
    await createBuilder()
        .type(TYPE)
        .param(0, 'Owner Key', 'The target owner to have the vacation.')
        .param(1, 'Start Date', 'The start date of the vacation.')
        .param(2, 'End Date', 'The end date of the vacation.')
        .param(3, '[Vacation ID]', 'The globally-unique id for the vacation. By default, this will be auto-generated.')
        .build();
}

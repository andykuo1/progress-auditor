/**
 * This file is used to specifically load the vacation entries from the review file.
 * 
 * @module VacationLoader
 */

import * as ReviewDatabase from '../../../database/ReviewDatabase.js';
import * as VacationReview from '../../../review/base/VacationReview.js';

/**
 * This needs to load and populate the VacationDatabase BEFORE assigners are loaded.
 * But all of this happens from the input of the ReviewDatabase.
 * Therefore, between input and assign data, vacations must be generated.
 */
export async function loadVacationsFromReviews(db, config)
{
    await VacationReview.review(db, config, db[ReviewDatabase.REVIEW_KEY]);
}

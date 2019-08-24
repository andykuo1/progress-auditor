import * as AssignSubmissionByPostIDResolver from '../../lib/piazza/resolver/AssignSubmissionByPostIDResolver.js';
import * as AssignSubmissionByIntroResolver from '../../lib/piazza/resolver/AssignSubmissionByIntroResolver.js';
import * as AssignSubmissionResolver from '../../lib/piazza/resolver/AssignSubmissionResolver.js';
import * as SlipDayResolver from '../../lib/piazza/resolver/SlipDayResolver.js';

export async function resolve(db, config)
{
    return Promise.all([
        AssignSubmissionByPostIDResolver.resolve(db),
        AssignSubmissionByIntroResolver.resolve(db),
        AssignSubmissionResolver.resolve(db),
        SlipDayResolver.resolve(db)
    ]);
}

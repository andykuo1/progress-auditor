import * as NullReviewer from '../../lib/piazza/reviewer/NullReviewer.js';
import * as SubmissionChangeAssignmentReviewer from '../../lib/piazza/reviewer/SubmissionChangeAssignmentReviewer.js';
import * as SubmissionIgnoreOwnerReviewer from '../../lib/piazza/reviewer/SubmissionIgnoreOwnerReviewer.js';
import * as SubmissionIgnoreReviewer from '../../lib/piazza/reviewer/SubmissionIgnoreReviewer.js';
import * as SubmissionAddReviewer from '../../lib/piazza/reviewer/SubmissionAddReviewer.js';
import * as UserAddOwnerKeyReviewer from '../../lib/piazza/reviewer/UserAddOwnerKeyReviewer.js';

const REGISTRY = new Map();

// Order does NOT matter!
REGISTRY.set(NullReviewer.REVIEW_ID, NullReviewer);
REGISTRY.set(UserAddOwnerKeyReviewer.REVIEW_ID, UserAddOwnerKeyReviewer);
REGISTRY.set(SubmissionChangeAssignmentReviewer.REVIEW_ID, SubmissionChangeAssignmentReviewer);
REGISTRY.set(SubmissionIgnoreOwnerReviewer.REVIEW_ID, SubmissionIgnoreOwnerReviewer);
REGISTRY.set(SubmissionIgnoreReviewer.REVIEW_ID, SubmissionIgnoreReviewer);
REGISTRY.set(SubmissionAddReviewer.REVIEW_ID, SubmissionAddReviewer);

export {
    REGISTRY
};
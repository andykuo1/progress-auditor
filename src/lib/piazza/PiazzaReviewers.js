import * as NullReviewer from './reviewer/NullReviewer.js';
import * as SubmissionChangeAssignmentReviewer from './reviewer/SubmissionChangeAssignmentReviewer.js';
import * as SubmissionIgnoreOwnerReviewer from './reviewer/SubmissionIgnoreOwnerReviewer.js';
import * as SubmissionIgnoreReviewer from './reviewer/SubmissionIgnoreReviewer.js';
import * as SubmissionAddReviewer from './reviewer/SubmissionAddReviewer.js';
import * as UserAddOwnerKeyReviewer from './reviewer/UserAddOwnerKeyReviewer.js';
import * as AssignmentChangeStatusReviewer from './reviewer/AssignmentChangeStatusReviewer.js';

const REGISTRY = new Map();

// Order does NOT matter!
REGISTRY.set(NullReviewer.REVIEW_ID, NullReviewer);
REGISTRY.set(UserAddOwnerKeyReviewer.REVIEW_ID, UserAddOwnerKeyReviewer);
REGISTRY.set(SubmissionChangeAssignmentReviewer.REVIEW_ID, SubmissionChangeAssignmentReviewer);
REGISTRY.set(SubmissionIgnoreOwnerReviewer.REVIEW_ID, SubmissionIgnoreOwnerReviewer);
REGISTRY.set(SubmissionIgnoreReviewer.REVIEW_ID, SubmissionIgnoreReviewer);
REGISTRY.set(SubmissionAddReviewer.REVIEW_ID, SubmissionAddReviewer);
REGISTRY.set(AssignmentChangeStatusReviewer.REVIEW_ID, AssignmentChangeStatusReviewer);

export {
    REGISTRY
};
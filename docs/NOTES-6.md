
Things left:
- COHORT should have EFFECTIVE END DATE vs ANTICIPATED END DATE to account for COOP / Summer Session.
- VACATIONS doesn’t need to be its own file. It could probably live in reviews.
- It would be nice to have someway to figure out parameters for reviews. Maybe documentation?
- A way to generate (cache) config files for those that don’t have one. (a file explorer?) (look for all inputs if missing)
- A way to lookup submission ids, user ids, assignments types, review ids, etc. while reviewing.
- A safeguard for overwriting outputs.
	- select for each or all.
	- REVIEW should output with OLD AND NEW (a copy with appended)
- Program args for config path and other flags.
- Submission diffing.
- More testing?
- Match LAST or WEEK[LAST]


"maxEndDates": [
["Special summer sess", "9//dfsaa"]
],

FIXES:
- Just use DATE not TIME
- UserID => PID





First, the GOAL:
- to generate slip days (and other things)

What we need:
- Schedules <- Generated from the program
- User data <- Given by the client
- Submissions
- Assignments
- Reviews
- etc.

So there are 2 types of data, given and generated.
And reviews fill in the “holes” the come up in given and generated if cannot be fixed otherwise.

Here is the implementation:
Therefore there are 3 stages:
Input
	- Resolve Config
		- Resolves relative paths to absolutes
	- Resolve Database
		- Create database
		- Load parsers, assigners, reviewers, resolvers, etc.
		- THIS WILL LOAD ALL STATIC DATA (Most client-defined data will go here)
	- Process Database (THIS IS IMPORTANT) (In code this is called, populate/fix)
		- Populate inputs, assignments, reviews, resolves, etc.
		- THIS WILL LOAD ALL DYNAMIC DATA (All generated data will go here)
Validation
	- Validate Database
		- Check for errors
			- Try to fix it
			- This will result in in-cache REVIEWS, which are the only thing that “changes” each run. These reviews are applied at each rerun of the “process”. Therefore, these “changes” will affect the outcome of the generated data, so it has reach.
			- Rerun “Process Database“ and try again for errors
Output
	- Generate Output



TUESDAY 11:30AM
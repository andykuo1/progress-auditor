
##

## Version 1
Everything will be based on CSV.

metadata.json
```json
{
    "data": [
        {
            "parser": "piazza-post-parser",
            "input": "./student-data-week0.csv",
        },
        {
            "parser": "csv-post-parser",
            "input": "./student-post-week0.csv",
        },
        {
            "parser": "csv-review-parser",
            "input": "./student-review-week0.csv",
        },
        {
            "parser": "csv-vacation-parser",
            "input": "./student-vacation-week0.csv"
        }
    ]
}
```

Each input file is processed by the specified parser into a large database. This database is generated every time the program runs. If data conflicts, it will resolve to the most recent file data. If data is missing, it is ignored (or, if essential, will be alerted).

What would you want to know about this data?
- To calculate the number of used slip days (by due date and in total).
    - Therefore, we need to know the days past the due date for each submission.
    - And we need to know if the due date is valid, or has been postponed due to vacation.
    - If there are edits that are past the due date, we need to know if it should be treated as a minor change, therefore no slip days used, or a major change, slip days are used.
- The threshold to determine major vs minor slip days.
- Number of max slip days available.
- User ID associated with the data. (And preferrably name and email)



> Lazy Loading data would be costly in performance.
- This is because I have to evaluate the content AFTER reading user data, all submissions, future assignments and current date, so I can filter what needs to be evaluated. Therefore, the threshold calculation (unless we compute it for every post, regardless of time submitted) must be computed after processing all the files. This means that in order to lazy load, I have to re-open the file for each submission and search for the submission content.

> Submission diffing will only diff the most recent VALID(if possible) to the most recent.
- Implications: Although late small changes are properly handled automatically or through review, small changes to a LATE submission, after review, are treated as full submissions.

- review establishes new base
- diff history review

> What to do about differing time zones?
	each user has its own timezone. then calc to local. deadline to local.
> What is the formula for report threshold?
	nothing done
	 give weight to early assignments
	holes
	Rate > -1

> first couple assignmets
	what has slip days?
	company permission 
	day after work.

> Access to 2019 data?

- sept 7
- quarter vs 6 month coop => spec summer deadline
- spec summer session date. is special
earliest of quarter end or internship.



Data interface through the program.
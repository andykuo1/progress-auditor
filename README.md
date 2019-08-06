# Internship Dashboard

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
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
            "readonly": true
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

Each input file is processed by the specified parser into a large database. This database is generated every time the program runs. If data conflicts, it will resolve to the most recent file.
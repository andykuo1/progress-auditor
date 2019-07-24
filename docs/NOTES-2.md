CSE 197 NOTES

Slip days quite hard to follow
API for handling data from other places


current students / requirements


Custom template
CSE 197 Add self to piazza
JSON, XML, CSV
Ignore endorsed.
K column
L - Q calculated every 2 weeks
Base sunday is like a root + X * 7


CSV UPLOAD

Print out
- Latest week each person has submitted
- Number of slip days
- Number of days past + any slip days regardless of submission
Mailmerge
YAM
PDF exporting?
- Name / PID at top
- Blank Template

CSV
		0	1	2	3	4	Total slip days
PERSON 

4 States
NOT YET DUE
COMPLETED ON TIME
DUE, but x days not yet submitted
DUE and x days past submission


Instructor / student Report


Inform all schedules and emailed to each person 
Allowed slip days
Reminder:
- If change let us know


Preferred Gradescope



BIG
- 160 * 10
- 350 words
- 11 MB ~ 20MB


DATA from past 2 weeks.

CSE 197 2017 Piazza


Piazza
Google Groups
Blog?
Canvas


- Data Privacy


Created vs Modified
- should not be late
Threshold to changes? then notify

Year-round class


TEMPLATE FOR POSTS


DONT FORGET TO ASK ABOUT TEAM LEAD.


FERPA
https://sites.google.com/eng.ucsd.edu/cseinternshipcourses/current-students/requirements?authuser=0




-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=
-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=

FLAPJS
- Auto test cases
- Reflection of the whole quarter
	- What I did for Flap.js (Resume level)

Week in subject of post
- prompts
- smart matching prompt and answers
	MATHC BY PROMPT
	PROMPTS by scrape? website lookup.
- by date

User Data
- Piazza user id (unique)
- users.json
- generate ID???

TEST CASE: What if 2 piazza accounts (therefore different emails)?

FLAG instead for submission missing owner..

LAZY LOAD DATA

In review vacation info is essential 
editable slip days

LAST week vs week prompt confusion


Monday / Tuesday does not make a full week reflection

- Introduction
- Week N
- Last Week Prompt


CSV words




Flap.js JFLAP Tests - unnecessary

The plan:
- To create a instructor report (CSV)
- To create the remaining reports (CSV)
- To export to PDF
- Mailmerge, UI, etc.

- What should be the template for posts?

- Are emails guaranteed unique? (for user key)
	- OK TO USE
- Is command line feature useful?
	 - EITHER
- Are we guaranteed vacation end dates?
	- If vacations are in-between weeks, how is that handled?
		- Partial weeks (by review) (threshold 5 days)
- If someone ends on a monday, do they still do a submission for that week? If not, what is the 
threshold of number of days in the week.
	- Verify Week 0 calculations (ok)
- Is extra custom data okay to be stored locally? (i.e. reviews, etc.)
	- Where is student data usually stored?
		- Student data is okay on local
		- Overwrite is frequent
- What do you think of the templates?
	- Move slips days to the front, instead of the back.
- Should postponing be a feature?
	
On hover over week status should give you an overview of that week (submission date, link to submission, etc)

DONT FORGET TO ASK FOR RETRO.

-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=
-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=-=-=-==-=


- What are groups?
- do follow-ups count as a submission?
- updating a note that is not theirs??
	// Week 2: Griffin Stamp (GOOD friends)
	sis updates a note belonging to gstamp

- stt010@ucsd.edu week3
	updated the note to have the “week 3” subject.
	however, the program did not recognize the source as week 3.



Note vs question?




Vacations and Review remains




Possible holes in deadlines

slip day slack => UTC , PST

submission by user

Audit Question Assignment
- CSV download



interaction network???

in-progess symbol instead of X 0


filename-DATE-VERSION-ETC


INPUT DATA DIRECTORY
PiazzaExports
- - DATE
- - - contribs.csv
Overrides


Student Report Contributions csv
Generated Date | User ID | Content
Keep track of all generated reports



4 types of reviews

Post edits after due date
user id | Original post | edited post | date posted

Data Error
Where it happened | error messages | reason

Custom Changes
target database | reason

Vacations

- Setting user emails
- Pairing user emails to Piazza / etac

How does google calculate date?



—Force flag for generating stuff
DONT GENERATE IF ERRORS



ERRORS:
post isn’t assigned to anyone
post is assigned to person but is not recognized.

post edits => post errors
- Pre- calculation overwrites
- 

Post Errors
- IGNORE POSTS
- Overwrite data
- How to resolve




- INGORE ALL POSTS BY USER
- Interactive

- Suggest to ignore
	- SUBJECT NOT FORMATTED CORRECTLY
	- Any users already defined in ignore file - just to check for sure


CUSTOM ERROR RESOLVERS?

FOR PIAZZA:
————————————————
n posts processed
 
————————————————
Should these be ignored?
- users by subject
- ignore emails (all posts), then ignore posts (specific) files
————————————————
There are problems with these? How do you want to resolve this?
- Per each error interactively
- Afterwards…


SUCH AS:
Post edit review
- post id e-mail id subject reason /error tag
IGNORE SUBMISSION VS IGNORE ERROR

ignore for now / ignore forever
—————————————————————

Some formula to calculate threshold to when to generate report






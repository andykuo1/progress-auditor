export function getOutputTypes()
{
    return [
        // The general expected output with all users and their slip days.
        'instructor',
        // The specific summary for each user, including options for pdf versions.
        'student',
        // The debug logs.
        'debug',
    ];
}

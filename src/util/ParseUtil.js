export function parseDate(value)
{
    // 2018-06-10 06:20:30 UTC
    const result = new Date(1000);

    const year = Number(value.substring(0, 4));
    const month = Number(value.substring(5, 7));
    const day = Number(value.substring(8, 10));

    const hour = Number(value.substring(11, 13));
    const minute = Number(value.substring(14, 16));
    const second = Number(value.substring(17, 19));

    if (year === NaN || month === NaN || day === NaN || hour === NaN || minute === NaN || second === NaN) throw new Error('Invalid date format - should be YYYY-MM-DD HH:MM:SS.');

    result.setUTCFullYear(year);
    result.setUTCMonth(month - 1);
    result.setUTCDate(day);
    result.setUTCHours(hour);
    result.setUTCMinutes(minute);
    result.setUTCSeconds(second);

    return result;
}

export function parseAmericanDate(value)
{
    // ex. 6/18/2019
    const result = new Date(-1);

    const dateArray = value.split('/');
    const year = Number(dateArray[2]);
    const month = Number(dateArray[0]);
    const day = Number(dateArray[1]);

    if (year === NaN || month === NaN || day === NaN) throw new Error('Invalid date format - should be MM/DD/YYYY.');

    result.setUTCFullYear(year);
    result.setUTCMonth(month - 1);
    result.setUTCDate(day);

    return result;
}

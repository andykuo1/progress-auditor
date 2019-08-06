function parseName(value)
{
    return value;
}

function parseEmail(value, ...values)
{
    const result = value.split(',').map(e => {
        if (e) return e.trim().toLowerCase();
    });
    if (values.length > 0)
    {
        for(const nextValue of values)
        {
            const nextResults = parseEmail(nextValue);
            if (Array.isArray(nextResults))
            {
                for(const nextResult of nextResults)
                {
                    result.push(nextResult);
                }
            }
            else
            {
                result.push(nextResults);
            }
        }
    }

    if (result.length === 1) return result[0];
    else return result;
}

module.exports = {
    parseName,
    parseEmail,
};
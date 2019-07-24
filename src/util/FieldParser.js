function parseName(value)
{
    return value;
}

function parseEmail(value, ...values)
{
    if (values.length > 0)
    {
        const result = [value];
        for(const value of values)
        {
            result.push(parseEmail(value));
        }
        return result;
    }
    else
    {
        return value;
    }
}

module.exports = {
    parseName,
    parseEmail,
};
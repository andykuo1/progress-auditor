function createDatabase()
{
    return {
        _errors: [],
        throwError(src, error, ...messages)
        {
            this._errors.push({
                source: src,
                error,
                message: messages.join(' ')
            });
        },
        clearErrors()
        {
            this._errors.length = 0;
        },
        getErrors()
        {
            return this._errors;
        }
    };
}

module.exports = {
    createDatabase
};
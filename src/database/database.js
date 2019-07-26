/**
 * Creates a database to hold all your data :)
 */
function createDatabase()
{
    return {
        _errors: [],
        throwError(...messages)
        {
            this._errors.push(messages.map(e => {
                switch(typeof e)
                {
                    case 'string':
                        return e;
                    case 'object':
                        return JSON.stringify(e, null, 4);
                    default:
                        return String(e);
                }
            }).join(' '));
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

/**
 * Generates a number hash for the string. For an empty string, it will return 0.
 * 
 * @param {String} [value=''] the string to hash
 * @returns {Number} a hash that uniquely identifies the string
 */
function stringHash(value='')
{
    let hash = 0;
    for(let i = 0, len = value.length; i < len; i++)
    {
        hash = Math.imul(31, hash) + value.charCodeAt(i) | 0;
    }
    return hash;
}

/**
 * Generates a uuidv4.
 * 
 * @returns {String} the universally unique id
 */
function uuid()
{
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

module.exports = {
    stringHash,
    uuid
};

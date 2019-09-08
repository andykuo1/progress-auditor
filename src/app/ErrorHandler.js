export function createErrorBuffer()
{
    return {
        errors: [],
        add(header, ...content)
        {
            if (content.length > 0)
            {
                this.errors.push([header, '=>', ...content, '<=']);
            }
            else
            {
                this.errors.push(header);
            }
        },
        isEmpty()
        {
            return this.errors.length <= 0;
        },
        flush(header)
        {
            throw new Error([header, '=>', this.errors, '<=']);
        }
    };
}

const IDENTITY = function(a) { return a; }

/**
 * This will build a table by first specifying the template columns
 * the table should have. Then you can "build" the table by
 * supplying the entires.
 */
class TableBuilder
{
    constructor()
    {
        this.entries = [];
        this.columns = [];
    }
    
    addEntry(...dataArgs)
    {
        this.entries.push(dataArgs);
    }

    addColumn(header, dataCallback = IDENTITY)
    {
        this.columns.push({
            header,
            data: dataCallback
        });
    }

    build()
    {
        const headerRow = [];
        for(const column of this.columns)
        {
            headerRow.push(column.header);
        }

        const table = [];
        table.push(headerRow);
        for(const entry of this.entries)
        {
            const row = [];
            for(const column of this.columns)
            {
                const value = column.data.apply(null, entry);
                row.push(value);
            }
            table.push(row);
        }
        return table;
    }
}

export default TableBuilder;
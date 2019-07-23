

function generateUserTable(db, columns)
{
    const header = columns.map(e => e.header);
    header.unshift('User ID');

    for(const userID of db.user.keys())
    {
        const row = [];
        row.push(userID);
        
        for(const column of columns)
        {
            row.push(column.data(userID));
        }
    }
}
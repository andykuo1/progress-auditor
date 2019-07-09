function createVacation(userID, startDate, endDate)
{
    return {
        id: userID,
        startDate,
        endDate,
    };
}

function addVacation(db, vacation)
{
    if (db.vacation.has(vacation.id))
    {
        throw new Error(`Failed to add vacation with id ${vacation.id} - found duplicate vacation.`);
    }
    else
    {
        db.vacation.set(vacation.id, user);
    }
}

module.exports = {
    createVacation,
    addVacation
};
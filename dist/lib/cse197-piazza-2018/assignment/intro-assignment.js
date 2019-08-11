const { AssignmentGenerator, DateUtil } = Library;

async function assign(db, name, userID, userSchedule, opts={})
{
    AssignmentGenerator.assign(db, userID, name, DateUtil.offsetDate(userSchedule.startDate, 7));
}

module.exports = {
    assign
};

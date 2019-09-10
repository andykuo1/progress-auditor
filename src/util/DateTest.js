import * as DateUtil from './DateUtil.js';
import * as DateGenerator from './DateGenerator.js';

function run()
{
    // This is a Friday.
    const date = DateGenerator.generateDate(DateUtil.parse('2019-09-13'));
    
    const past = DateUtil.getPastSunday(date);
    const prev = DateUtil.getPrevSunday(date);
    const next = DateUtil.getNextSunday(date);
    const effectiveNext = DateUtil.getNextEffectiveSunday(date, 3);
    const nextNext = DateUtil.getNextSunday(next);
    const nextPrev = DateUtil.getPrevSunday(next);
    const prevPrev = DateUtil.getPrevSunday(prev);
    const prevNext = DateUtil.getNextSunday(prev);
    const pastPast = DateUtil.getPastSunday(past);
    logDate(date);
    logDate(past);
    logDate(prev);
    logDate(next);

    logDivider("Testing date compare");
    assertDateEquals(date, date);
    assertDateEquals(prev, prev);
    assertDateEquals(next, next);
    assertDateEquals(past, past);
    assertDateEquals(effectiveNext, effectiveNext);
    assertDateNotEquals(date, next);
    assertDateNotEquals(date, prev);

    logDivider("Testing prev and next sundays");
    assertDateNotEquals(next, nextPrev);
    assertDateNotEquals(next, nextNext);
    assertDateNotEquals(prev, prevNext);
    assertDateNotEquals(prev, prevPrev);
    assertDateEquals(nextPrev, prev);
    assertDateEquals(prevNext, next);

    logDivider("Testing past sundays");
    assertDateEquals(past, prev);
    assertDateEquals(past, pastPast);

    logDivider("Testing if getting sequential next Sundays is correct.");
    assertEquals(7, DateUtil.getDaysBetween(next, nextNext));
    assertEquals(7, DateUtil.getDaysBetween(prev, next));
    assertEquals(7, DateUtil.getDaysBetween(prevPrev, prev));
    assertEquals(0, DateUtil.getDaysBetween(next, next));
    assertEquals(0, DateUtil.getDaysBetween(past, pastPast));
    assertEquals(5, DateUtil.getDaysBetween(date, past));
    assertEquals(5, DateUtil.getDaysBetween(past, date));

    logDivider("Testing if isWithinDates() is correct.");
    assertEquals(true, DateUtil.isWithinDates(date, date, date));
    assertEquals(false, DateUtil.isWithinDates(prev, date, next));
    assertEquals(true, DateUtil.isWithinDates(date, prev, next));
    assertEquals(true, DateUtil.isWithinDates(prev, prev, next));
    assertEquals(true, DateUtil.isWithinDates(next, prev, next));

    logDivider("Testing if offsetDate() is correct.");
    assertDateEquals(date, DateUtil.offsetDate(date, 0));
    assertDateEquals(next, DateUtil.offsetDate(date, 2));
    assertDateEquals(prev, DateUtil.offsetDate(date, -5));
    assertEquals(1, DateUtil.getDaysBetween(date, DateUtil.offsetDate(date, -1)));
    assertEquals(true, DateUtil.isWithinDates(date, past, DateUtil.offsetDate(past, DateUtil.DAYS_IN_WEEK)));

    logDivider("Testing weekly sunday generator.");
    {
        const startDate = DateUtil.parse('2019-9-9');
        const endDate = DateUtil.parse('2019-9-29');
        const result = DateGenerator.generateWeeklySunday(startDate, endDate);
        assertDateEquals(DateUtil.parse('2019-9-15'), result[0]);
        assertDateEquals(DateUtil.parse('2019-9-22'), result[1]);
        assertDateEquals(DateUtil.parse('2019-9-29'), result[2]);
    }
    logDivider('Testing ineffective work weeks.');
    {
        const startDate = DateUtil.parse('2019-9-12');
        const endDate = DateUtil.parse('2019-9-17');
        const result = DateGenerator.generateWeeklySunday(startDate, endDate);
        assertEquals(0, result.length);
    }
    {
        const startDate = DateUtil.parse('2019-9-12');
        const endDate = DateUtil.parse('2019-9-21');
        const result = DateGenerator.generateWeeklySunday(startDate, endDate);
        assertEquals(0, result.length);
    }
    logDivider('Testing effective work weeks.');
    {
        const startDate = DateUtil.parse('2019-9-11');
        const endDate = DateUtil.parse('2019-9-21');
        const result = DateGenerator.generateWeeklySunday(startDate, endDate);
        assertDateEquals(DateUtil.parse('2019-9-15'), result[0]);
    }
    {
        const startDate = DateUtil.parse('2019-9-8');
        const endDate = DateUtil.parse('2019-9-15');
        const result = DateGenerator.generateWeeklySunday(startDate, endDate);
        assertDateEquals(DateUtil.parse('2019-9-15'), result[0]);
    }
    logDivider('Testing out-of-bounds validators.')
    {
        const startDate = DateUtil.parse('2019-9-8');
        const endDate = DateUtil.parse('2019-9-15');
        const validator = DateGenerator.createOffsetDelayValidator([
            [startDate, endDate]
        ]);
        const result = DateGenerator.generateWeeklySunday(startDate, endDate, validator);
        assertEquals(0, result.length);
    }
    {
        const startDate = DateUtil.parse('2019-9-8');
        const endDate = DateUtil.parse('2019-9-15');
        const validator = DateGenerator.createOffsetDelayValidator([
            [endDate, endDate]
        ]);
        const result = DateGenerator.generateWeeklySunday(startDate, endDate, validator);
        assertEquals(0, result.length);
    }
    logDivider('Testing offset delay validators.')
    {
        const startDate = DateUtil.parse('2019-9-8');
        const endDate = DateUtil.parse('2019-9-16');
        const lastSunday = DateUtil.parse('2019-9-15');
        const validator = DateGenerator.createOffsetDelayValidator([
            [lastSunday, lastSunday]
        ]);
        const result = DateGenerator.generateWeeklySunday(startDate, endDate, validator);
        assertEquals(1, result.length);
        assertDateEquals(DateUtil.parse('2019-9-16'), result[0]);
    }
    {
        const startDate = DateUtil.parse('2019-9-8');
        const endDate = DateUtil.parse('2019-9-17');
        const lastSunday = DateUtil.parse('2019-9-15');
        const validator = DateGenerator.createOffsetDelayValidator([
            [lastSunday, DateUtil.offsetDate(lastSunday, 1)]
        ]);
        const result = DateGenerator.generateWeeklySunday(startDate, endDate, validator);
        assertEquals(1, result.length);
        assertDateEquals(DateUtil.parse('2019-9-17'), result[0]);
    }
    logDivider('Testing week validators.')
    {
        const startDate = DateUtil.parse('2019-9-1');
        const endDate = DateUtil.parse('2019-9-30');
        const validator = DateGenerator.createOffsetDelayValidator([]);
        const result = DateGenerator.generateWeeklySunday(startDate, endDate, validator);
        assertDateEquals(DateUtil.parse('2019-9-8'), result[0]);
        assertDateEquals(DateUtil.parse('2019-9-15'), result[1]);
        assertDateEquals(DateUtil.parse('2019-9-22'), result[2]);
        assertDateEquals(DateUtil.parse('2019-9-29'), result[3]);
    }
    {
        const startDate = DateUtil.parse('2019-9-1');
        const endDate = DateUtil.parse('2019-9-30');
        const startVacationDate = DateUtil.parse('2019-9-9');
        const endVacationDate = DateUtil.parse('2019-9-13');
        const vacationRange = [startVacationDate, endVacationDate];
        const ranges = DateGenerator.convertDateRangesToEffectiveWorkWeeks([vacationRange]);
        assertDateEquals(DateUtil.parse('2019-9-8'), ranges[0][0]);
        assertDateEquals(DateUtil.parse('2019-9-14'), ranges[0][1]);
        const validator = DateGenerator.createOffsetDelayValidator(ranges);
        const result = DateGenerator.generateWeeklySunday(startDate, endDate, validator);
        assertDateEquals(DateUtil.parse('2019-9-15'), result[0]);
        assertDateEquals(DateUtil.parse('2019-9-22'), result[1]);
        assertDateEquals(DateUtil.parse('2019-9-29'), result[2]);
    }
    {
        const startVacationDate = DateUtil.parse('2019-9-11');
        const endVacationDate = DateUtil.parse('2019-9-13');
        const vacationRange = [startVacationDate, endVacationDate];
        const ranges = DateGenerator.convertDateRangesToEffectiveWorkWeeks([vacationRange]);
        assertEquals(0, ranges.length);
    }
    {
        const startVacationDate = DateUtil.parse('2019-9-8');
        const endVacationDate = DateUtil.parse('2019-9-10');
        const vacationRange = [startVacationDate, endVacationDate];
        const ranges = DateGenerator.convertDateRangesToEffectiveWorkWeeks([vacationRange]);
        assertEquals(0, ranges.length);
    }
    {
        const startDate = DateUtil.parse('2019-9-1');
        const endDate = DateUtil.parse('2019-9-30');
        const startVacationDate = DateUtil.parse('2019-9-9');
        const endVacationDate = DateUtil.parse('2019-9-15');
        const vacationRange = [startVacationDate, endVacationDate];
        const ranges = DateGenerator.convertDateRangesToEffectiveWorkWeeks([vacationRange]);
        // Is this expected? If it is due the Sunday after an effective week,
        // and if the next is a vacation week, the due date becomes the Sunday they get back.
        assertDateEquals(DateUtil.parse('2019-9-8'), ranges[0][0]);
        assertDateEquals(DateUtil.parse('2019-9-14'), ranges[0][1]);
        const validator = DateGenerator.createOffsetDelayValidator(ranges);
        const result = DateGenerator.generateWeeklySunday(startDate, endDate, validator);
        assertDateEquals(DateUtil.parse('2019-9-15'), result[0]);
        assertDateEquals(DateUtil.parse('2019-9-22'), result[1]);
        assertDateEquals(DateUtil.parse('2019-9-29'), result[2]);
        console.log(`From ${DateUtil.stringify(startDate, false)} to ${DateUtil.stringify(endDate, false)} => ${result.map(date => DateUtil.stringify(date, false))}`);
    }
}

function logDate(date)
{
    console.log(DateUtil.stringify(date));
}

function assertDateNotEquals(expected, result)
{
    if (DateUtil.compareDates(expected, result) == 0)
    {
        logDateExpectation(expected, result);
    }
    else
    {
        logSuccess();
    }
}

function assertDateEquals(expected, result)
{
    if (DateUtil.compareDates(expected, result) != 0)
    {
        logDateExpectation(expected, result);
    }
    else
    {
        logSuccess();
    }
}

function assertEquals(expected, result)
{
    if (expected != result)
    {
        logExpectation(expected, result);
    }
    else
    {
        logSuccess();
    }
}

function logDateExpectation(expected, result)
{
    logExpectation(DateUtil.stringify(expected), DateUtil.stringify(result));
}

let TEST_COUNT = 1;

function logExpectation(expected, result)
{
    console.error(`${TEST_COUNT++}) Expected '${expected}', but was '${result}'`);
}

function logSuccess()
{
    console.log(`${TEST_COUNT++}) Passed!`);
}

function logDivider(message = 'Test:')
{
    console.log(`\n== ${message}`);
    TEST_COUNT = 1;
}

run();
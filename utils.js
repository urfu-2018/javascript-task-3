'use strict';

const getDayShift = dayOrder => dayOrder * 24 * 60;

const mapDayToShift = {
    'ПН': getDayShift(0),
    'ВТ': getDayShift(1),
    'СР': getDayShift(2),
    'ЧТ': getDayShift(3),
    'ПТ': getDayShift(4),
    'СБ': getDayShift(5),
    'ВС': getDayShift(6)
};

const mapDayNumberToString = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 *
 * @param {string} timeStr - строка в формате "05:59+06"
 * @returns {number} - число минут прошедшее с начала дня
 */
function parseTimeWithTimeZone(timeStr) {
    const extractedParts = /(\d{1,2}):(\d{1,2})\+(\d{1,2})/.exec(timeStr);

    const hours = Number(extractedParts[1]);
    const minutes = Number(extractedParts[2]);
    const timeZone = Number(extractedParts[3]);

    return hours * 60 + minutes - timeZone * 60;
}

/**
 *
 * @param {string} dateStr - строка в виде "СР 07:50+09"
 * @returns {number} - число минут прошедшее с 00:00 понедельника
 */
function parseDateWithTimezone(dateStr) {
    const [day, time] = dateStr.split(' ');

    return mapDayToShift[day] + parseTimeWithTimeZone(time);
}

/**
 *
 * @param {object} scheduleEntry
 * @param {string} scheduleEntry.from
 * @param {string} scheduleEntry.to
 * @returns {number[]} - interval
 */
function convertScheduleEntryToInterval(scheduleEntry) {
    const { from, to } = scheduleEntry;

    return [parseDateWithTimezone(from), parseDateWithTimezone(to)];
}

/**
 *
 * @param {[number, number]} interval
 * @param {number} value
 * @returns {boolean}
 */
function isValueInInterval(interval, value) {
    return value >= interval[0] && value < interval[1];
}

/**
 *
 * @param {string} format - формат с местами под вставку в виде %DD, %HH, %MM
 * @param {number} utcMinutes - кол-во минут в нулевой временной зоне
 * @param {number} timeZone - временная зона, в которой нужно отформатировать время
 * @returns {string} - отформатрованная строка
 */
function formatDate(format, utcMinutes, timeZone) {
    const totalMinutes = utcMinutes + timeZone * 60;

    const minutes = totalMinutes % 60;
    const totalHours = (totalMinutes - minutes) / 60;
    const hours = totalHours % 24;
    const days = (totalHours - hours) / 24;

    return format
        .replace(/%DD/, mapDayNumberToString[days])
        .replace(/%HH/, hours.toString().padStart(2, '0'))
        .replace(/%MM/, minutes.toString().padStart(2, '0'));
}

module.exports = {
    parseTimeWithTimeZone,
    parseDateWithTimezone,
    convertScheduleEntryToInterval,
    isValueInInterval,
    formatDate
};

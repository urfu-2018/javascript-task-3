'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
const DAYS = new Map([
    ['ПН', 0], ['ВТ', 1],
    ['СР', 2], ['ЧТ', 3],
    ['ПТ', 4], ['СБ', 5],
    ['ВС', 6]]);
const TIME_PATTERN_BANK = /^(\d\d):(\d\d)\+(\d+)$/;
const DEAD_LINE = 24 * 60 * 3;
function toMinutes(days, hours, minutes, timeZone = 0) {
    return (days * 24 + hours + timeZone) * 60 + minutes;
}

function parseTime(time) {
    const [, hours, minutes, timeZone] = time.match(TIME_PATTERN_BANK);

    return [hours, minutes, timeZone].map(val => parseInt(val));
}

function parseWokringHours(workingHours) {
    const [hoursFrom, minutesFrom, timeZone] = parseTime(workingHours.from);
    const [hoursTo, minutesTo] = parseTime(workingHours.to);

    const workingHoursToMinutes = day => (
        {
            from: toMinutes(day, hoursFrom, minutesFrom),
            to: toMinutes(day, hoursTo, minutesTo)
        }
    );

    return [
        Array.from(DAYS.values())
            .slice(0, 3)
            .map(workingHoursToMinutes),
        timeZone
    ];
}

function flatSchedule(schedule) {
    return Object.values(schedule)
        .reduce((acc, val) => acc.concat(val), []);
}

function intervalsToMinutes(intervals, bankTimeZone) {
    const busyTimeToMinutes = scheduleString => {
        const [day, rawTime] = scheduleString.split(' ');
        const days = DAYS.get(day);
        const [hours, minutes, timeZone] = parseTime(rawTime);
        const diff = bankTimeZone - timeZone;

        return toMinutes(days, hours, minutes, diff);
    };

    const intervalToMinutes = (interval) => ({
        from: busyTimeToMinutes(interval.from),
        to: busyTimeToMinutes(interval.to)
    });

    return intervals.map(intervalToMinutes)
        .sort((a, b) => a.from - b.from);
}

function isIntersected(a, b) {
    return a.from < b.to && a.to > b.from;
}

function unionBusyIntervals(intervals) {
    return intervals.reduce((acc, val) => {
        const lastInterval = acc[acc.length - 1];
        if (!isIntersected(lastInterval, val)) {
            return acc.concat(val);
        }
        lastInterval.to = Math.max(lastInterval.to, val.to);

        return acc;
    }, [intervals[0]]);
}

function invertintervals(intervals) {
    const goodIntervals = intervals.filter(interval => interval.from <= DEAD_LINE);
    const invertInterval = (interval, i) => ({
        from: interval.to,
        to: (goodIntervals[i + 1]) ? goodIntervals[i + 1].from : DEAD_LINE
    });

    return (goodIntervals.length)
        ? [{ from: 0, to: goodIntervals[0].from }]
            .concat(goodIntervals.map(invertInterval))
        : [{ from: 0, to: DEAD_LINE }];
}

function getTimeToDo(intervals, duration, bankTime) {
    const robberyIntervals = [];
    bankTime.forEach(workingHours => intervals.forEach(interval => {
        if (isIntersected(workingHours, interval)) {
            robberyIntervals.push({
                from: Math.max(workingHours.from, interval.from),
                to: Math.min(workingHours.to, interval.to)
            });
        }
    }));

    return robberyIntervals
        .filter(interval => interval.to - interval.from >= duration)
        .sort((a, b) => a.from - b.from);
}

function fromMinutes(minutes) {
    const days = Math.floor(minutes / (60 * 24));
    const dd = Array.from(DAYS.keys())[days];
    const hh = Math.floor((minutes - days * 60 * 24) / 60);
    const mm = minutes - days * 60 * 24 - hh * 60;

    return [dd].concat([hh, mm].map(val => val.toString().padStart(2, '0')));
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const [bankSchedule, bankTimeZone] = parseWokringHours(workingHours);
    const intervalsInMinutes = intervalsToMinutes(flatSchedule(schedule), bankTimeZone);
    const freeSpaces = invertintervals(unionBusyIntervals(intervalsInMinutes));
    const result = getTimeToDo(freeSpaces, duration, bankSchedule);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return result.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (result.length === 0) {
                return '';
            }
            const robberyStart = result[0].from;
            const [dd, hh, mm] = fromMinutes(robberyStart);

            return template
                .replace('%DD', dd)
                .replace('%HH', hh)
                .replace('%MM', mm);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

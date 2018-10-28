'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const DAYS = new Map([['ПН', 0], ['ВТ', 1], ['СР', 2], ['ЧТ', 3], ['ПТ', 4], ['СБ', 5], ['ВС', 6]]);
const ROBBERY_DAYS_LIMIT = 3;
const TIME_PATTERN = /^(\d\d):(\d\d)\+(\d+)$/;
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
const EARLIEST_TIME = 0;
const LATEST_TIME = MINUTES_IN_DAY * ROBBERY_DAYS_LIMIT;
const ROBBERY_SHIFT = 30;

function parseTime(rawTime) {
    const [, hours, minutes, timeZone] = rawTime.match(TIME_PATTERN);

    return [hours, minutes, timeZone].map(val => parseInt(val));
}

function toMinutes(days, hours, minutes, diff = 0) {
    return (days * HOURS_IN_DAY + hours + diff) * MINUTES_IN_HOUR + minutes;
}

function fromMinutes(minutes) {
    const days = Math.floor(minutes / MINUTES_IN_DAY);
    const dd = Array.from(DAYS.keys())[days];
    const hh = Math.floor((minutes - days * MINUTES_IN_DAY) / MINUTES_IN_HOUR);
    const mm = minutes - days * MINUTES_IN_DAY - hh * MINUTES_IN_HOUR;

    return [dd].concat([hh, mm].map(val => val.toString().padStart(2, '0')));
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
            .slice(0, ROBBERY_DAYS_LIMIT)
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

    const intervalToMinutes = ({ from, to }) => ({
        from: busyTimeToMinutes(from),
        to: busyTimeToMinutes(to)
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

function invertIntervals(intervals) {
    const goodIntervals = intervals.filter(interval => interval.from <= LATEST_TIME);
    const invertInterval = (interval, i) => ({
        from: interval.to,
        to: (goodIntervals[i + 1]) ? goodIntervals[i + 1].from : LATEST_TIME
    });

    return (!goodIntervals.length) ? [{ from: EARLIEST_TIME, to: LATEST_TIME }]
        : [{ from: EARLIEST_TIME, to: goodIntervals[0].from }]
            .concat(goodIntervals.map(invertInterval));
}

function getRobberyIntervals(intervals, bankSchedule, duration) {
    const robberyIntervals = [];

    for (const workingHours of bankSchedule) {
        for (const interval of intervals) {
            if (isIntersected(workingHours, interval)) {
                robberyIntervals.push({
                    from: Math.max(workingHours.from, interval.from),
                    to: Math.min(workingHours.to, interval.to)
                });
            }
        }
    }

    return robberyIntervals.filter(interval => interval.to - interval.from >= duration);
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
    const freeIntervals = invertIntervals(unionBusyIntervals(intervalsInMinutes));
    const robberyIntervals = getRobberyIntervals(freeIntervals, bankSchedule, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyIntervals.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }
            const robberyStart = robberyIntervals[0].from;
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

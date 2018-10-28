'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MINUTES_IN_DAY = MINUTES_IN_HOUR * HOURS_IN_DAY;
const DAYS_OF_WEEK = [
    'ПН',
    'ВТ',
    'СР',
    'ЧТ',
    'ПТ',
    'СБ',
    'ВС'
];
const START_OF_WEEK = dateFactory(DAYS_OF_WEEK[0], 0, 0);
const END_OF_WEEK = dateFactory(DAYS_OF_WEEK[DAYS_OF_WEEK.length - 1], 24, 0);
const ROBBERY_TIME_INTERVAL = intervalFactory(
    dateFactory('ПН', 0, 0),
    dateFactory('ЧТ', 0, 0)
);

function timeFactory(hours, minutes, zone) {
    return {
        hours,
        minutes,
        zone
    };
}

function dateFactory(day, hours, minutes, zone) {
    return {
        day,
        time: timeFactory(hours, minutes, zone)
    };
}

function intervalFactory(from, to) {
    return {
        from,
        to
    };
}

function dateCompare(date1, date2) {
    if (date1 === date2) {
        return 0;
    }

    const daysCompare = DAYS_OF_WEEK.indexOf(date1.day) - DAYS_OF_WEEK.indexOf(date2.day);

    if (daysCompare !== 0) {
        return Math.sign(daysCompare);
    }

    return timeCompare(date1.time, date2.time);
}

function timeCompare(time1, time2) {
    if (time1 === time2) {
        return 0;
    }

    const hoursCompare = time1.hours - time2.hours;

    if (hoursCompare !== 0) {
        return Math.sign(hoursCompare);
    }

    return Math.sign(time1.minutes - time2.minutes);
}

function getBusyIntervals(bankWorkInterval, schedule, bankZone) {
    const bankCloseIntervals = getCloseIntervals(bankWorkInterval);

    return Object.values(schedule)
        .reduce((periods1, periods2) => periods1.concat(periods2))
        .map(period => {
            return intervalFactory(
                toDateWithCustomZone(period.from, bankZone),
                toDateWithCustomZone(period.to, bankZone));
        })
        .concat(bankCloseIntervals)
        .concat(invertIntervals([ROBBERY_TIME_INTERVAL]));
}

function getValidIntervals(busyIntervals, duration) {
    const sortedBusyIntervals = busyIntervals
        .sort((interval1, interval2) => dateCompare(interval1.from, interval2.from));

    return invertIntervals(mergeIntervals(sortedBusyIntervals))
        .filter(interval => intervalToMinutes(interval) >= duration);
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
    const bankWorkInterval = intervalFactory(
        parseTimeWithZone(workingHours.from),
        parseTimeWithZone(workingHours.to)
    );

    const bankTimeZone = bankWorkInterval.from.zone;

    const busyIntervals = getBusyIntervals(bankWorkInterval, schedule, bankTimeZone);
    let validInterval = getValidIntervals(busyIntervals, duration).shift();

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return validInterval !== undefined;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (validInterval === undefined) {
                return '';
            }

            const validDate = validInterval.from;
            const { hours, minutes } = validDate.time;

            return template
                .replace('%HH', hours < 10 ? '0' + hours : hours)
                .replace('%MM', minutes < 10 ? '0' + minutes : minutes)
                .replace('%DD', validDate.day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const newBusyInterval = intervalFactory(
                validInterval.from,
                addMinutes(validInterval.from, 30)
            );
            busyIntervals.push(newBusyInterval);
            const newValidInterval = getValidIntervals(busyIntervals, duration).shift();
            if (newValidInterval) {
                validInterval = newValidInterval;

                return true;
            }

            return false;
        }
    };
}

function addMinutes(date, minutes) {
    let newDateInMinutes = dateToMinutesFromStartOfWeek(date) + minutes;
    const newDay = parseInt(newDateInMinutes / MINUTES_IN_DAY);
    newDateInMinutes -= MINUTES_IN_DAY * newDay;
    const newHour = parseInt(newDateInMinutes / MINUTES_IN_HOUR);
    newDateInMinutes -= MINUTES_IN_HOUR * newHour;

    return dateFactory(
        DAYS_OF_WEEK[newDay],
        newHour,
        newDateInMinutes,
        date.time.zone);
}

function dateToMinutesFromStartOfWeek(date) {
    return DAYS_OF_WEEK.indexOf(date.day) * MINUTES_IN_DAY +
        date.time.hours * MINUTES_IN_HOUR +
        date.time.minutes;
}

function getCloseIntervals(workInterval) {
    const { from, to } = workInterval;
    const weekOpenIntervals = DAYS_OF_WEEK
        .map(day => intervalFactory(
            dateFactory(day, from.hours, from.minutes),
            dateFactory(day, to.hours, to.minutes),
        ));

    return invertIntervals(weekOpenIntervals);
}

function intervalToMinutes(interval) {
    const { from, to } = interval;
    const days = DAYS_OF_WEEK.indexOf(to.day) - DAYS_OF_WEEK.indexOf(from.day);
    const hours = to.time.hours - from.time.hours;
    const minutes = to.time.minutes - from.time.minutes;

    return days * MINUTES_IN_DAY + hours * MINUTES_IN_HOUR + minutes;
}

function mergeIntervals(intervals) {
    let lastInterval = intervals[0];
    const newIntervals = [];
    for (let i = 1; i < intervals.length; i++) {
        let newInterval = intervals[i];
        if (dateCompare(lastInterval.to, newInterval.from) === -1) {
            newIntervals.push(lastInterval);
            lastInterval = newInterval;
        } else {
            lastInterval.to = dateCompare(lastInterval.to, newInterval.to) === -1
                ? newInterval.to
                : lastInterval.to;
        }
    }
    newIntervals.push(lastInterval);

    return newIntervals;
}

function invertIntervals(intervals) {
    const newIntervals = [];
    newIntervals.push(intervalFactory(
        START_OF_WEEK,
        intervals[0].from
    ));
    for (let i = 0; i < intervals.length - 1; i++) {
        newIntervals.push(intervalFactory(
            intervals[i].to,
            intervals[i + 1].from,
        ));
    }
    newIntervals.push(intervalFactory(
        intervals[intervals.length - 1].to,
        END_OF_WEEK
    ));

    return newIntervals;
}

function toDateWithCustomZone(dateString, newZone) {
    const [day, timeWithZone] = dateString.split(' ');
    const time = parseTimeWithZone(timeWithZone);
    let newHours = time.hours - time.zone + newZone;
    let newDay = newHours < 0 ? shiftDay(day, -1) : day;
    newDay = newHours >= HOURS_IN_DAY ? shiftDay(day, 1) : newDay;
    newHours = (newHours + HOURS_IN_DAY) % HOURS_IN_DAY;

    return dateFactory(newDay, newHours, time.minutes, newZone);
}

function parseTimeWithZone(timeString) {
    const dateRegex = /^(\d\d):(\d\d)\+(\d\d|\d)$/;
    const [hours, minutes, zone] = dateRegex.exec(timeString).slice(1)
        .map(x => parseInt(x));

    return timeFactory(hours, minutes, zone);
}

function shiftDay(day, shift) {
    shift = shift % DAYS_OF_WEEK.length + DAYS_OF_WEEK.length;
    const newDayIndex = (DAYS_OF_WEEK.indexOf(day) + shift) % DAYS_OF_WEEK.length;

    return DAYS_OF_WEEK[newDayIndex];
}

module.exports = {
    getAppropriateMoment,
    toDateWithCustomZone,
    mergeIntervals,
    timeCompare,
    dateCompare,
    invertIntervals,
    intervalToMinutes,
    dateFactory,
    intervalFactory,
    timeFactory,
    addMinutes,
    isStar
};

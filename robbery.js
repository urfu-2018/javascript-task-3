'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const daysOfTheWeek = ['ПН', 'ВТ', 'СР'];
const MINUTES_IN_DAY = 1440;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const bankTimeZone = parseInt(workingHours.from.match(/\+(\d)/));

    const timeFrame = getRobberyTimeFrame(bankTimeZone);

    const busyIntervals = getBusyIntervalsInTimestamp(schedule, bankTimeZone);
    const freeIntervals = getFreeTimeIntervals(busyIntervals, timeFrame);
    const robberyIntervals = getIntersectionsOfFreeAndBank(freeIntervals, workingHours);

    const moments = getAllMoments(robberyIntervals, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return moments.get() !== undefined;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            const robberyDate = getDateFromTimestamp(moments.get());

            if (this.exists()) {
                return formatDateString(robberyDate, template);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return moments.next();
        }
    };
}

function getRobberyTimeFrame() {
    return {
        from: 0,
        to: (daysOfTheWeek.length * MINUTES_IN_DAY) - 1
    };
}

function getDayOfWeekNumber(dayOfTheWeek) {
    return daysOfTheWeek.indexOf(dayOfTheWeek);
}

function getBusyIntervalsInTimestamp(schedule, bankTimeZone) {
    const intervals = Object.values(schedule)
        .reduce((acc, intervalsArray) => {
            intervalsArray.forEach(scheduleInterval => {
                const timestampInterval = getTimestampInterval(scheduleInterval, bankTimeZone);
                acc.push(timestampInterval);
            });

            return acc;
        }, []);

    return intervals;
}

function getTimestampInterval(scheduleInterval, bankTimeZone) {
    return {
        from: getTimestamp(scheduleInterval.from, bankTimeZone),
        to: getTimestamp(scheduleInterval.to, bankTimeZone)
    };
}

function getTimestamp(scheduleTimeString, bankTimezone) {
    const date = getDateFromString(scheduleTimeString);

    const fullDays = date.dayNumber * MINUTES_IN_DAY;
    const fullHours = (date.hours - date.timeZoneOffset + bankTimezone) * MINUTES_IN_HOUR;

    return fullDays + fullHours + date.minutes;
}

function getDateFromString(dateString) {
    const timeStringPattern = /(ПН|ВТ|СР)\s(.+):(.+)\+(\d+)/;

    const timeStringComponents = dateString.match(timeStringPattern);

    const dayNumber = getDayOfWeekNumber(timeStringComponents[1]);
    const hours = parseInt(timeStringComponents[2]);
    const minutes = parseInt(timeStringComponents[3]);
    const timeZoneOffset = parseInt(timeStringComponents[4]);

    return { dayNumber, hours, minutes, timeZoneOffset };
}

function getDateFromTimestamp(timestamp) {
    const day = Math.trunc(timestamp / MINUTES_IN_DAY);
    const hours = Math.trunc(timestamp / MINUTES_IN_HOUR) % HOURS_IN_DAY;
    const minutes = timestamp % MINUTES_IN_HOUR;

    return { day, hours, minutes };
}

function addLeadingZero(number) {
    const string = number.toString();

    return string.length === 2 ? string : '0' + string;
}

function getFreeTimeIntervals(busyIntervals, timeFrame) {
    if (busyIntervals.length === 0) {
        return [timeFrame];
    }

    const sortedIntervals = busyIntervals.sort(compareIntervals);

    const freeIntervals = [];

    if (sortedIntervals[0].from > timeFrame.from) {
        freeIntervals.push({
            from: timeFrame.from,
            to: sortedIntervals[0].from
        });
    }

    let currentEnd = sortedIntervals[0].to;
    for (let i = 1; i < sortedIntervals.length; i++) {
        const next = sortedIntervals[i];

        if (currentEnd <= next.from) {
            freeIntervals.push({
                from: currentEnd,
                to: next.from
            });
        }
        currentEnd = Math.max(currentEnd, next.to);
    }

    if (currentEnd < timeFrame.to) {
        freeIntervals.push({
            from: currentEnd,
            to: timeFrame.to
        });
    }

    return freeIntervals;
}

function compareIntervals(firstInterval, secondInterval) {
    const fromDiff = firstInterval.from - secondInterval.from;
    const toDiff = firstInterval.to - secondInterval.to;

    return fromDiff === 0 ? toDiff : fromDiff;
}

function getIntersectionsOfFreeAndBank(freeIntervals, bankWorkingHours) {
    const intersections = daysOfTheWeek.reduce((acc, day) => {
        const intersectionsToday = getAllTodaysIntersections(freeIntervals, bankWorkingHours, day);
        acc = acc.concat(intersectionsToday);

        return acc;
    }, []);

    return intersections;
}

function getAllTodaysIntersections(freeIntervals, bankWorkingHours, day) {
    const bankWorkingInterval = getBankWorkingIntervalForDay(bankWorkingHours, day);

    return freeIntervals.reduce((acc, interval) => {
        const intervalStartsAfterBankClosing = interval.from >= bankWorkingInterval.to;
        const intervalEndsBeforeBankOpening = interval.to <= bankWorkingInterval.from;

        if (intervalEndsBeforeBankOpening || intervalStartsAfterBankClosing) {
            return acc;
        }

        acc.push({
            from: Math.max(interval.from, bankWorkingInterval.from),
            to: Math.min(interval.to, bankWorkingInterval.to)
        });

        return acc;
    }, []);
}

function getBankWorkingIntervalForDay(bankWorkingHours, day) {
    const bankTimeZone = parseInt(bankWorkingHours.from.match(/\+(\d)/));

    return {
        from: getTimestamp(`${day} ${bankWorkingHours.from}`, bankTimeZone),
        to: getTimestamp(`${day} ${bankWorkingHours.to}`, bankTimeZone)
    };
}

function getAllMoments(robberyIntervals, duration) {
    const ATTEMPT_OFFSET = 30;

    const moments = robberyIntervals.reduce((acc, interval) => {
        let currentInterval = interval;
        let currentIntervalLength = currentInterval.to - currentInterval.from;

        do {
            if (currentIntervalLength >= duration) {
                acc.push(currentInterval.from);
            }

            currentInterval = cutInterval(currentInterval, ATTEMPT_OFFSET);
            currentIntervalLength = currentInterval.to - currentInterval.from;

        } while (currentIntervalLength > ATTEMPT_OFFSET);

        return acc;
    }, []);

    return {
        moments,
        index: 0,

        get: function () {
            return this.moments[this.index];
        },

        next: function () {
            if (moments[this.index + 1]) {
                this.index++;

                return true;
            }

            return false;
        }
    };
}

function cutInterval(interval, startOffset) {
    return { from: interval.from + startOffset, to: interval.to };
}

function formatDateString(date, template) {
    const regex = /%(.{2})/g;

    return template.replace(regex, match => {
        switch (match) {
            case '%DD':
                return daysOfTheWeek[date.day];
            case '%HH':
                return addLeadingZero(date.hours);
            case '%MM':
                return addLeadingZero(date.minutes);
            default :
                break;
        }
    });
}

module.exports = {
    getAppropriateMoment,
    getBusyIntervalsInTimestamp,
    getFreeTimeIntervals,

    isStar
};

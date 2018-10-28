'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const WORKING_DAYS = ['ПН', 'ВТ', 'СР'];
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;
const [CLOSED, OPENED] = [0, 1];
const [FIRST_MOMENT, LAST_MOMENT] = [0, 7 * MINUTES_IN_DAY];
const EXTRA_TIME = 30;

function parseTime(timeString) {
    const [day, fullTime] = timeString.split(' ');
    let result = DAYS_OF_WEEK.indexOf(day) * MINUTES_IN_DAY;
    const [time, timezone] = fullTime.split('+');
    const [hours, minutes] = time.split(':');
    result += (parseInt(hours) - parseInt(timezone)) * MINUTES_IN_HOUR + parseInt(minutes);

    return result;
}

function getEvents(schedule, invert = false) {
    let result = [];
    for (const descr of schedule) {
        if (invert) {
            result.push([parseTime(descr.from), CLOSED]);
            result.push([parseTime(descr.to), OPENED]);
        } else {
            result.push([parseTime(descr.from), OPENED]);
            result.push([parseTime(descr.to), CLOSED]);
        }
    }

    return result;
}

function extractTimezone(fullTime) {
    return parseInt(fullTime.split('+')[1]);
}

function getRobbersEvents(schedule) {
    let result = [];
    for (const robberSchedule of Object.values(schedule)) {
        result = result.concat(getEvents(robberSchedule, true));
        result = result.concat([
            [FIRST_MOMENT, OPENED],
            [LAST_MOMENT, CLOSED]
        ]);
    }

    return result;
}

function getBankEvents(duration) {
    return getEvents(WORKING_DAYS.map(day => {
        return {
            from: day + ' ' + duration.from,
            to: day + ' ' + duration.to,
        };
    }));
}

function isGoodMoment(balance, requiredCnt, type) {
    return balance === requiredCnt - 1 && type === CLOSED;
}

function getRobberyIntervals(events, duration, requiredCnt) {
    let [balance, lastMoment, result] = [0, Infinity, []];
    for (let [time, type] of events) {
        balance += type === OPENED ? 1 : -1;
        const curDuration = time - lastMoment;
        if (balance === requiredCnt) {
            lastMoment = time;
        }
        if (isGoodMoment(balance, requiredCnt, type) && curDuration >= duration) {
            result.push([lastMoment, time]);
        }
    }

    return result;
}

function prepareEvents(schedule, workingHours) {
    let events = getRobbersEvents(schedule).concat(getBankEvents(workingHours));
    events.sort((a, b) => {
        return a[0] - b[0];
    });

    return events;
}

function pad(x, length) {
    x = x.toString();

    return '0'.repeat(length - x.length) + x;
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
    console.info(schedule, duration, workingHours);
    const events = prepareEvents(schedule, workingHours);
    const timezone = extractTimezone(workingHours.to);
    let intervals = getRobberyIntervals(events, duration, 4);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return intervals.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (intervals.length === 0) {
                return '';
            }
            let startTimestamp = intervals[0][0] + timezone * MINUTES_IN_HOUR;
            const day = Math.trunc(startTimestamp / MINUTES_IN_DAY);
            startTimestamp %= MINUTES_IN_DAY;
            const hours = Math.trunc(startTimestamp / MINUTES_IN_HOUR);
            const minutes = startTimestamp % MINUTES_IN_HOUR;

            return template
                .replace('%DD', DAYS_OF_WEEK[day])
                .replace('%HH', pad(hours, 2))
                .replace('%MM', pad(minutes, 2));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (intervals.length === 0) {
                return false;
            }
            if (intervals[0][1] - intervals[0][0] >= EXTRA_TIME + duration) {
                intervals[0][0] += EXTRA_TIME;

                return true;
            }
            if (intervals.length === 1) {
                return false;
            }
            intervals = intervals.slice(1);

            return true;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

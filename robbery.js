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
            result.push({ time: parseTime(descr.from), type: CLOSED });
            result.push({ time: parseTime(descr.to), type: OPENED });
        } else {
            result.push({ time: parseTime(descr.from), type: OPENED });
            result.push({ time: parseTime(descr.to), type: CLOSED });
        }
    }

    return result;
}

function extractTimezone(fullTime) {
    return parseInt(fullTime.split('+')[1]);
}

function getRobbersEvents(schedule, firstMoment, lastMoment) {
    let result = [];
    for (const robberSchedule of Object.values(schedule)) {
        result = result.concat(getEvents(robberSchedule, true));
        result = result.concat([
            { time: firstMoment, type: OPENED },
            { time: lastMoment, type: CLOSED }
        ]);
    }

    return result;
}

function getBankEvents(duration) {
    return getEvents(WORKING_DAYS.map(day => {
        return {
            from: day + ' ' + duration.from,
            to: day + ' ' + duration.to
        };
    }));
}

function isGoodMoment(balance, requiredCnt, type) {
    return balance === requiredCnt - 1 && type === CLOSED;
}

function getRobberyIntervals(events, duration, requiredCnt) {
    let [balance, lastMoment, result] = [0, Infinity, []];
    for (let { time, type } of events) {
        balance += type === OPENED ? 1 : -1;
        const curDuration = time - lastMoment;
        if (balance === requiredCnt) {
            lastMoment = time;
        }
        if (isGoodMoment(balance, requiredCnt, type) && curDuration >= duration) {
            result.push({ start: lastMoment, end: time });
        }
    }

    return result;
}

function prepareEvents(schedule, workingHours, firstMoment, lastMoment) {
    let events = getRobbersEvents(schedule, firstMoment, lastMoment)
        .concat(getBankEvents(workingHours));
    events.sort((a, b) => {
        if (a.time - b.time !== 0) {
            return a.time - b.time;
        }

        return b.type - a.type;
    });

    return events;
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
    const timezone = extractTimezone(workingHours.to);
    const startTime = parseTime('ПН 00:00+' + timezone);
    const endTime = parseTime('ВС 23:59+' + timezone);
    const events = prepareEvents(schedule, workingHours, startTime, endTime);
    let intervals = getRobberyIntervals(events, duration, Object.values(schedule).length + 1);

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
            let startTimestamp = intervals[0].start + timezone * MINUTES_IN_HOUR;
            const day = Math.trunc(startTimestamp / MINUTES_IN_DAY);
            startTimestamp %= MINUTES_IN_DAY;
            const hours = Math.trunc(startTimestamp / MINUTES_IN_HOUR);
            const minutes = startTimestamp % MINUTES_IN_HOUR;

            return template
                .replace('%DD', DAYS_OF_WEEK[day])
                .replace('%HH', hours.toString().padStart(2, '0'))
                .replace('%MM', minutes.toString().padStart(2, '0'));
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

            const newStart = intervals[0].start + EXTRA_TIME;
            for (let i = 0; i < intervals.length; i++) {
                if (intervals[i].end - Math.max(newStart, intervals[i].start) >= duration) {
                    intervals = intervals.slice(i);
                    intervals[0].start = Math.max(newStart, intervals[0].start);

                    return true;
                }
            }

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

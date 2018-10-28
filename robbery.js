'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const DAYS_IN_WEEK = 7;
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
const MINUTES_IN_WEEK = DAYS_IN_WEEK * HOURS_IN_DAY * MINUTES_IN_HOUR;
const TIME_REGEX = /(?:(ПН|ВТ|СР|ЧТ|ПТ|СБ|ВС) )?(\d{2}):(\d{2})(?:\+(\d+))?/;
const DAYS_OF_WEEK = {
    'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6,
    0: 'ПН', 1: 'ВТ', 2: 'СР', 3: 'ЧТ', 4: 'ПТ', 5: 'СБ', 6: 'ВС'
};
const TIME_LIMIT = DAYS_OF_WEEK['ЧТ'] * MINUTES_IN_DAY;

function fillWeek(week, schedule, workingHours) {
    const bankZone = parseInt(workingHours.from.split('+')[1]);

    for (const person of Object.keys(schedule)) {
        for (const interval of schedule[person]) {
            fillPersonBusynessHours(week, interval, bankZone);
        }
    }

    fillBankClosedHours(week, workingHours, bankZone);
}

function fillPersonBusynessHours(week, interval, bankZone) {
    const start = transformTime(interval.from, bankZone);
    const end = transformTime(interval.to, bankZone);

    for (let i = start; i < end; i++) {
        week[i]++;
    }
}

function fillBankClosedHours(week, workingHours, bankZone) {
    const start = transformTime(workingHours.from, bankZone);
    const end = transformTime(workingHours.to, bankZone);
    for (let day = 0; day < DAYS_IN_WEEK; day++) {
        const lowerLimit = day * MINUTES_IN_DAY;
        const upperLimit = lowerLimit + MINUTES_IN_DAY;

        for (let i = lowerLimit; i < lowerLimit + start; i++) {
            week[i]++;
        }

        for (let i = lowerLimit + end; i < upperLimit; i++) {
            week[i]++;
        }
    }
}

function transformTime(time, bankZone) {
    const match = time.match(TIME_REGEX);
    const dayOfWeekInMinutes = DAYS_OF_WEEK[match[1]] * MINUTES_IN_DAY;
    const dayHoursInMinutes = (parseInt(match[2]) +
        bankZone - parseInt(match[4])) * MINUTES_IN_HOUR;
    const minutes = parseInt(match[3]);

    const result = dayHoursInMinutes + minutes +
        (isNaN(dayOfWeekInMinutes) ? 0 : dayOfWeekInMinutes);

    if (result < 0) {
        return 0;
    }

    if (result > MINUTES_IN_WEEK) {
        return MINUTES_IN_WEEK;
    }

    return result;
}

function formatSmallTime(time) {
    return time < 10 ? '0' + time : time;
}

function getAllPossibleStartTimes(week, duration) {
    const startTimes = [];

    for (let i = 0; i < TIME_LIMIT; i++) {
        const intervalLength = getIntervalLength(week, duration, i);
        if (intervalLength === duration) {
            startTimes.push(i);
            i += 29;
        } else {
            i += intervalLength;
        }
    }

    return startTimes;
}

function getIntervalLength(week, duration, i) {
    if (week[i] !== 0) {
        return 0;
    }

    let intervalLength = 1;
    while (week[++i] === 0 && intervalLength !== duration) {
        intervalLength++;
    }

    return intervalLength;
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
    const week = new Uint8Array(MINUTES_IN_WEEK);
    fillWeek(week, schedule, workingHours);
    const times = getAllPossibleStartTimes(week, duration);
    let currentTimeIndex = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return currentTimeIndex < times.length;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (currentTimeIndex >= times.length) {
                return '';
            }

            const currentStartTime = times[currentTimeIndex];
            const day = DAYS_OF_WEEK[Math.floor(currentStartTime / MINUTES_IN_DAY)];
            const hours = Math.floor((currentStartTime % MINUTES_IN_DAY) / MINUTES_IN_HOUR);
            const minutes = currentStartTime % MINUTES_IN_HOUR;

            return template.replace('%DD', day)
                .replace('%HH', formatSmallTime(hours))
                .replace('%MM', formatSmallTime(minutes));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (++currentTimeIndex >= times.length) {
                currentTimeIndex--;

                return false;
            }

            return true;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

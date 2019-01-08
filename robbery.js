'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

const DAYS_MAP = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const ROBBERY_DAYS = ['ПН', 'ВТ', 'СР'];
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = 1440;

const TIME_REGEXP = /^(\d{2}):(\d{2})(\+\d{1,2})$/;
const DATETIME_REGEXP = /^(?:(ПН|ВТ|СР|ЧТ|ПТ|СБ|ВС)\s)?(\d{2}):(\d{2})(\+\d{1,2})$/;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const bankWorkingTimeFrom = parseTime(workingHours.from);
    const bankWorkingTimeTo = parseTime(workingHours.to);
    const bankTimezone = bankWorkingTimeFrom.timezone;

    const bankWorkingIntervals = [];
    for (let day = 0; day < ROBBERY_DAYS.length; day++) {
        bankWorkingIntervals.push({
            from: convertDateToMinutes(Object.assign({ day }, bankWorkingTimeFrom)),
            to: convertDateToMinutes(Object.assign({ day }, bankWorkingTimeTo))
        });
    }

    const robbersIntervals = Object.values(schedule)
        .reduce((allIntervals, robberIntervals) => allIntervals.concat(robberIntervals), [])
        .map(interval => {
            const intervalDateTimeFrom = parseDate(interval.from);
            const intervalDateTimeTo = parseDate(interval.to);

            return {
                'from': applyTimezone(
                    convertDateToMinutes(intervalDateTimeFrom),
                    intervalDateTimeFrom.timezone,
                    bankTimezone
                ),
                'to': applyTimezone(
                    convertDateToMinutes(intervalDateTimeTo),
                    intervalDateTimeTo.timezone,
                    bankTimezone
                )
            };
        });

    const robberyTime = findRobberyTime(bankWorkingIntervals, robbersIntervals, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyTime !== -1;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return robberyTime !== -1 ? formatMinutes(robberyTime, template) : '';
        }
    };
}

function parseTime(date) {
    const match = date.match(TIME_REGEXP);

    return {
        hours: Number(match[1]),
        minutes: Number(match[2]),
        timezone: Number(match[3])
    };
}

function parseDate(date) {
    const match = date.match(DATETIME_REGEXP);

    return {
        day: DAYS_MAP[match[1]],
        hours: Number(match[2]),
        minutes: Number(match[3]),
        timezone: Number(match[4])
    };
}

function convertDateToMinutes(date) {
    return date.day * MINUTES_IN_DAY + date.hours * MINUTES_IN_HOUR + date.minutes;
}

function applyTimezone(minutes, originalTimezone, targetTimezone) {
    return minutes + (targetTimezone - originalTimezone) * MINUTES_IN_HOUR;
}

function findRobberyTime(bankIntervals, robbersIntervals, duration) {
    const checkIsBankWorks = currentTime => interval => {
        return currentTime >= interval.from && currentTime + duration <= interval.to;
    };

    const checkIsRobberFree = currentTime => interval => {
        return (currentTime < interval.from && currentTime + duration <= interval.from) ||
            (currentTime >= interval.to && currentTime + duration >= interval.to);
    };

    let currentTime = 0;
    const endTime = ROBBERY_DAYS.length * MINUTES_IN_DAY;

    while (currentTime < endTime) {
        const isBankWorks = bankIntervals.filter(
            checkIsBankWorks(currentTime)
        ).length >= 1;

        const areAllRobbersFree = robbersIntervals.filter(
            checkIsRobberFree(currentTime)
        ).length === robbersIntervals.length;

        if (isBankWorks && areAllRobbersFree) {
            return currentTime;
        }

        currentTime++;
    }

    return -1;
}

function formatMinutes(minutes, template) {
    const day = Math.floor(minutes / MINUTES_IN_DAY);
    const hours = Math.floor((minutes - day * MINUTES_IN_DAY) / MINUTES_IN_HOUR);
    const remainingMinutes = minutes - day * MINUTES_IN_DAY - hours * MINUTES_IN_HOUR;

    return template
        .replace('%DD', ROBBERY_DAYS[day])
        .replace('%HH', hours.toString().padStart(2, '0'))
        .replace('%MM', remainingMinutes.toString().padStart(2, '0'));
}

module.exports = {
    getAppropriateMoment,

    isStar
};

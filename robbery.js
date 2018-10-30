'use strict';
const utils = require('./utils');

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const bankOpenedIntervals = getBankOpenedIntervals(workingHours);
    const bankTimeZone = Number(workingHours.from.split('+')[1]);
    const timeZoneShift = bankTimeZone * 60;
    const gangstersBusyIntervals = Object.values(schedule).map(man =>
        man.map(utils.convertScheduleEntryToInterval));


    let momentFound = findNext(
        [-timeZoneShift, 72 * 60 - timeZoneShift],
        bankOpenedIntervals,
        gangstersBusyIntervals,
        duration
    );

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return momentFound !== null;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (momentFound === null) {
                return '';
            }

            return utils.formatDate(template, momentFound, bankTimeZone);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const next = findNext(
                [momentFound + 30, 72 * 60 - timeZoneShift],
                bankOpenedIntervals,
                gangstersBusyIntervals,
                duration
            );

            if (next !== null) {
                momentFound = next;

                return true;
            }

            return false;
        }
    };
}

function findNext(domain, bankOpenedIntervals, gangstersBusyIntervals, duration) {
    const [start, end] = domain;

    let streak = 0;

    for (let i = start; i < end; i++) {
        if (streak >= duration) {
            return i - duration;
        }
        if (isMomentAvailableToGang(bankOpenedIntervals, gangstersBusyIntervals, i)) {
            streak ++;

        } else {
            streak = 0;
        }
    }

    return null;
}

function isMomentAvailableToGang(bankSchedule, gangstersSchedule, moment) {
    const bankOpened = bankSchedule.some((dayInterval) =>
        utils.isValueInInterval(dayInterval, moment));
    const gangstersFree = !gangstersSchedule.some((gangster) =>
        gangster.some((interval) => utils.isValueInInterval(interval, moment)));

    return bankOpened && gangstersFree;
}

function getBankOpenedIntervals(bankWorkingHours) {
    return ['ПН', 'ВТ', 'СР'].map(
        day => [
            utils.parseDateWithTimezone(`${day} ${bankWorkingHours.from}`),
            utils.parseDateWithTimezone(`${day} ${bankWorkingHours.to}`)
        ]
    );
}

module.exports = {
    getAppropriateMoment,
    getBankOpenedIntervals,
    isMomentAvailableToGang,
    isStar
};

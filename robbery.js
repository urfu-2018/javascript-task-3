'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const dayToHours = new Map(
    [['ПН', 0],
        ['ВТ', 24],
        ['СР', 48]]
);

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

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return template;
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

function convertToMinutesInBankTime(timestring, bankTime) {
    let day = timestring.slice(0, 2);
    let hours = parseInt(timestring.slice(3, 5)) + parseInt(timestring.slice(9)) - bankTime;
    let minutes = parseInt(timestring.slice(6, 8));

    return dayToHours[day] + hours * 60 + minutes;
}

function getCommonListOfBusyIntervals(schedule) {
    const intervals = [];
    for (let user in schedule) {
        if (! schedule.hasOwnProperty(user)) {
            continue;
        }
        for (let interval in schedule[user]) {
            if (! schedule[user].hasOwnProperty(interval)) {
                continue;
            }
            intervals.push([convertToMinutesInBankTime(interval.from), user, 'from']);
            intervals.push([convertToMinutesInBankTime(interval.to), user, 'to']);
        }
    }
    intervals.sort((a, b)=>a[0] - b[0]);
}

function getFreeTime(busyIntervals) {
    const isOpen = new Map();
    const resultIntervals = [];
    let isUnionOpen = true;
    resultIntervals.push([0, 'from']);
    for (let i = 0; i < busyIntervals.length; i++) {
        let time = busyIntervals[i];
        isOpen[time[1]] = time[2] === 'from';
        if (isOpen.every(x=>!x) && !isUnionOpen) {
            resultIntervals.push([time[0], 'from']);
            isUnionOpen = true;
        } else if (isUnionOpen) {
            resultIntervals.push([time[0], 'to']);
            isUnionOpen = false;
        }
    }

    return resultIntervals;
}

function getFreeTimeIntervals(userToBusyIntervals) {
    for (let day = 0; day < 3; day++) {

    }
}

module.exports = {
    getAppropriateMoment,

    isStar
};

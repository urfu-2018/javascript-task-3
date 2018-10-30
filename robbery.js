'use strict';

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
    console.info(schedule, duration, workingHours);

    let isSuitable = buildSchedule(schedule, workingHours);
    
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

function getTimeAfter(isSuitable, minute) {
    for () 
}

function buildSchedule(rawSchedule, workingHours) {
    const busyTimes = enumerateTimes(rawSchedule)
        .map(x => ({
            from: convertStringWithDayToMinutes(x.from),
            to: convertStringWithDayToMinutes(x.to)
        }));

    let openTime = convertStringToMinutes(workingHours.from);
    let closeTime = convertStringToMinutes(workingHours.to);

    return (time) => {
        let timeOfDay = time % (24 * 60);
        if (openTime > timeOfDay || closeTime < timeOfDay) {
            return false;
        }

        return busyTimes.eachTest(x => !(x.from <= time && time <= x.to));
    };
}

function *enumerateTimes(schedule) {
    for (let prop in schedule) {
        if (schedule.hasOwnProperty(prop)) {
            yield* schedule[prop];
        }
    }
}

function convertStringWithDayToMinutes(s) {
    let parts = s.split(' ');

    return getDayNumber(s[0]) * 24 * 60 + convertStringToMinutes(s[1]);
}

function convertStringToMinutes(s) {
    const match = s.match(/^(\d+):(\d+)\+(\d+)$/);

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const offset = Number(match[3]);

    return (hour + offset) * 60 + minute;
}

function getDayNumber(day) {
    return ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].indexOf(day);
}

module.exports = {
    getAppropriateMoment,

    isStar
};

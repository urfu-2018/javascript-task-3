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
    getNewScheduleFormat(schedule)
    console.info(days);
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

function DayToMinutes(day) {
    if (day === 'ПН') {
        return 0;
    } else if (day === 'ВТ') {
        return 24 * 60;
    } else if (day === 'СР') {
        return 24 * 2 * 60;
    } else
        return -1;
}

function getNewScheduleFormat(schedule) {
    const newSchedule = { Danny: [], Rusty: [], Linus: [] }
    schedule.Danny.map(r => getNewScheduleRowFormat(r))
}

function getNewScheduleRowFormat(r) {
    const newFrom = DayToMinutes(r.from.substring(0, 2)) + parseTimeToMinutes(r.from.substring(3));
    const newTo = DayToMinutes(r.to.substring(0, 2)) + parseTimeToMinutes(r.to.substring(3));
    if (newTo - newFrom < duration) {
        return null;
    }
    else {
        return { from: newFrom, to: newTo }
    }
}

const days = ['ПН', 'ВТ', 'СР'];
function mmayb1eDays(scheduleBoy) {
    days.forEach(e => {
        if (!maybeDay(scheduleBoy, e)) {
            days.splice(days.indexOf(e), 1)
        }
    });
}

function maybeDay(schedule, day) {
    let haveTimeIsCurrentDay = false;
    schedule.forEach(element => {
        if (element.from.indexOf(day) !== -1) {
            haveTimeIsCurrentDay = true;
        }
    });
    return haveTimeIsCurrentDay;
}

function parseTimeToMinutes(time) {
    return parseInt(time.substring(0, 2)) * 60 + parseInt(time.substring(3, 5)) + parseInt(time.substring(6, 7)) * 60;
}

module.exports = {
    getAppropriateMoment,

    parseTimeToMinutes,
    isStar
};

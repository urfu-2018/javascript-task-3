'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const robbery = ['ПН', 'ВТ', 'СР'];

function getAllTime(time) {
    const day = days.indexOf(time.split(' ')[0]) * 24 * 60;
    const strTime = time.split(' ')[1];
    const comparator = /(\d{2}):(\d{2})\+(\d)/.exec(strTime);
    const hour = parseInt(comparator[1]) * 60;
    const minute = parseInt(comparator[2]);
    const timeZone = parseInt(comparator[3]);

    return { time: day + hour + minute, timeZone: timeZone };
}

function getTimeZone(strTime) {
    const comparator = /(\d{2}):(\d{2})\+(\d)/.exec(strTime);

    return parseInt(comparator[3]);
}

function correctTimeZone(time, oldTimeZone, newTimeZone) {
    return { time: time + (newTimeZone - oldTimeZone) * 60, timeZone: newTimeZone };
}

function checkRobbers(start, scheduleBand, duration) {
    const res = [];

    for (let i = 0; i < scheduleBand.length; i++) {
        if ((start < scheduleBand[i].from && start + duration <= scheduleBand[i].from) ||
            (start >= scheduleBand[i].to && start + duration >= scheduleBand[i].to)) {
            res.push(scheduleBand[i]);
        }
    }

    return res;
}

function checkBank(start, scheduleBank, duration) {
    const res = [];

    for (let i = 0; i < scheduleBank.length; i++) {
        if (start >= scheduleBank[i].from && start + duration <= scheduleBank[i].to) {
            res.push(scheduleBank[i]);
        }
    }

    return res;
}

function findTimeToRobbery(scheduleBand, scheduleBank, duration) {
    const endTime = 24 * 60 * robbery.length;

    for (let startRobbery = 0; startRobbery < endTime; startRobbery++) {
        const hasFreeTime =
            checkRobbers(startRobbery, scheduleBand, duration).length === scheduleBand.length;
        const isBankWork = checkBank(startRobbery, scheduleBank, duration).length > 0;

        if (hasFreeTime && isBankWork) {
            return { find: true, time: startRobbery };
        }
    }

    return { find: false, time: 0 };
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
    const scheduleBand = [].concat.apply([], Object.values(schedule));
    const scheduleBandMinutes = [];
    const bankZone = getTimeZone(workingHours.from);

    for (let i = 0; i < scheduleBand.length; i++) {
        const from = getAllTime(scheduleBand[i].from);
        const to = getAllTime(scheduleBand[i].to);

        scheduleBandMinutes.push({ from: correctTimeZone(from.time, from.timeZone, bankZone).time,
            to: correctTimeZone(to.time, to.timeZone, bankZone).time });
    }

    const scheduleBankMinutes = [];

    for (let i = 0; i < robbery.length; i++) {
        scheduleBankMinutes.push({ from: getAllTime(`${robbery[i]} ${workingHours.from}`).time,
            to: getAllTime(`${robbery[i]} ${workingHours.to}`).time });
    }

    const moment = findTimeToRobbery(scheduleBandMinutes, scheduleBankMinutes, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return moment.find;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!moment.find) {
                return '';
            }

            const day = Math.floor(moment.time / 1440);
            const hours = Math.floor((moment.time - day * 1440) / 60);
            const minutes = moment.time - day * 1440 - hours * 60;

            return template.replace('%HH', hours.toString().padStart(2, '0'))
                .replace('%MM', minutes.toString().padStart(2, '0'))
                .replace('%DD', days[day]);
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

module.exports = {
    getAppropriateMoment,

    isStar
};

'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const robbery = ['ПН', 'ВТ', 'СР'];

function getTimeInMinute(time) {
    const dayInMinute = days.indexOf(time.split(' ')[0]) * 24 * 60;
    const matchTime = /(\d{2}):(\d{2})\+(\d)/.exec(time);
    const timeZone = parseInt(matchTime[3]);
    const hours = parseInt(matchTime[1]) * 60;
    const minute = parseInt(matchTime[2]);

    return { time: dayInMinute + hours + minute - (timeZone * 60), timeZone: timeZone };
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

    for (let i = 0; i < scheduleBand.length; i++) {
        scheduleBandMinutes.push({ from: getTimeInMinute(scheduleBand[i].from).time,
            to: getTimeInMinute(scheduleBand[i].to).time });
    }

    const scheduleBankMinutes = [];
    let bankZone;

    for (let i = 0; i < robbery.length; i++) {
        bankZone = getTimeInMinute(`${robbery[i]} ${workingHours.from}`).timeZone;

        scheduleBankMinutes.push({ from: getTimeInMinute(`${robbery[i]} ${workingHours.from}`).time,
            to: getTimeInMinute(`${robbery[i]} ${workingHours.to}`).time });
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
            const min = moment.time - day * 1440 - hours * 60;

            return template.replace('%HH', (hours + bankZone).toString())
                .replace('%MM', min.toString())
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

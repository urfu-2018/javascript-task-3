'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const robbery = ['ПН', 'ВТ', 'СР'];
const REGEX_FOR_TIME = /(\D{2} )?(\d{2}):(\d{2})\+(\d)/;
const MIN_IN_DAY = 1440;
const MIN_IN_HOURS = 60;

function parseTime(time) {
    const data = REGEX_FOR_TIME.exec(time);
    const day = days.indexOf(data[1].trim()) * MIN_IN_DAY;
    const hour = parseInt(data[2]) * MIN_IN_HOURS;
    const minute = parseInt(data[3]);
    const timeZone = parseInt(data[4]);


    return { time: day + hour + minute, timeZone: timeZone };
}

function getTimeZone(strTime) {
    const data = REGEX_FOR_TIME.exec(strTime);

    return parseInt(data[4]);
}

function correctTimeZone(time, oldTimeZone, newTimeZone) {
    return { time: time + (newTimeZone - oldTimeZone) * MIN_IN_HOURS, timeZone: newTimeZone };
}

function checkFreeRobbers(start, scheduleBand, duration) {
    const res = [];

    for (let i = 0; i < scheduleBand.length; i++) {
        if ((start < scheduleBand[i].from && start + duration <= scheduleBand[i].from) ||
            (start >= scheduleBand[i].to && start + duration >= scheduleBand[i].to)) {
            res.push(scheduleBand[i]);
        }
    }

    return res;
}

function checkOpenRobbers(start, scheduleBank, duration) {
    const res = [];

    for (let i = 0; i < scheduleBank.length; i++) {
        if (start >= scheduleBank[i].from && start + duration <= scheduleBank[i].to) {
            res.push(scheduleBank[i]);
        }
    }

    return res;
}

function findTimeToRobbery(scheduleBand, scheduleBank, duration, fromMoment = 0) {
    const endTime = 24 * 60 * robbery.length;

    for (let startRobbery = fromMoment; startRobbery < endTime; startRobbery++) {
        const hasFreeTime =
            checkFreeRobbers(startRobbery, scheduleBand, duration).length === scheduleBand.length;
        const isBankWork = checkOpenRobbers(startRobbery, scheduleBank, duration).length > 0;

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
    const scheduleBand = [].concat(...Object.values(schedule));
    const bankZone = getTimeZone(workingHours.from);

    const scheduleBandMinutes = scheduleBand.map(element => {
        const from = parseTime(element.from);
        const to = parseTime(element.to);

        return { from: correctTimeZone(from.time, from.timeZone, bankZone).time,
            to: correctTimeZone(to.time, to.timeZone, bankZone).time };
    });

    const scheduleBankMinutes = robbery.map(day => {
        return { from: parseTime(`${day} ${workingHours.from}`).time,
            to: parseTime(`${day} ${workingHours.to}`).time };
    });

    let moment = findTimeToRobbery(scheduleBandMinutes, scheduleBankMinutes, duration);

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

            const day = Math.floor(moment.time / MIN_IN_DAY);
            const hours = Math.floor((moment.time - day * MIN_IN_DAY) / MIN_IN_HOURS);
            const minutes = moment.time - day * MIN_IN_DAY - hours * MIN_IN_HOURS;

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
            if (!moment.find) {
                return false;
            }

            const fewMomentsLater = findTimeToRobbery(scheduleBandMinutes, scheduleBankMinutes,
                duration, moment.time + 30);

            if (fewMomentsLater.find) {
                moment = fewMomentsLater;
            }

            return fewMomentsLater.find;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

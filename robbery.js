'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

let timeLine = [];

function convertDayToMinuts(day) {
    if (day === 'ПН') {

        return 24 * 60;
    }
    if (day === 'ВТ') {

        return 48 * 60;
    }
    if (day === 'СР') {

        return 72 * 60;
    }
}

function сonvertminutsToFormat(minuts, bankTimeZone) {
    minuts += bankTimeZone * 60;
    let day = Math.trunc(minuts / 24 * 60);
    minuts -= day * 24 * 60;
    let hours = Math.trunc(minuts / 60);
    minuts -= hours * 60;
    let time = {
        hours: hours,
        minuts: minuts
    };
    if (day === 1) {
        time.day = 'ПН';
    }
    if (day === 2) {
        time.day = 'ВТ';
    }
    if (day === 3) {
        time.day = 'СР';
    }

    return time;
}

function convertToMinuts(timeString) {
    let minuts = 0;
    minuts += convertDayToMinuts(timeString.slice(0, 2));
    let hours = parseInt(timeString.match('(\\d\\d):(\\d\\d)')[1]);
    minuts += parseInt(timeString.match('(\\d\\d):(\\d\\d)')[2]);
    let timeZone = parseInt(timeString.match('\\+(\\d)')[1]);
    minuts += (hours - timeZone) * 60;

    return minuts;
}

function addWorkingHoursToTimeLine(workingHours) {
    timeLine.push({ first: convertToMinuts('ПН ' + workingHours.from), second: 1 });
    timeLine.push({ first: convertToMinuts('ПН ' + workingHours.to), second: -1 });
    timeLine.push({ first: convertToMinuts('ВТ ' + workingHours.from), second: 1 });
    timeLine.push({ first: convertToMinuts('ВТ ' + workingHours.to), second: -1 });
    timeLine.push({ first: convertToMinuts('СР ' + workingHours.from), second: 1 });
    timeLine.push({ first: convertToMinuts('СР ' + workingHours.to), second: -1 });
}

function scanLine(duration, lastAppropriateMoment) {
    let notBusy = 0;
    for (let i = 0; i < timeLine.length - 1; i++) {
        notBusy += timeLine[i].second;
        if (notBusy === 4 &&
            timeLine[i + 1].first - timeLine[i].first >= duration &&
            timeLine[i].first > lastAppropriateMoment) {

            return timeLine[i].first;
        }

    }

    return -1;
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
    let bankTimeZone = parseInt(workingHours.from.match('\\+(\\d)')[1]);
    let keys = Object.keys(schedule);
    for (let i = 0; i < keys.length; i++) {
        let roberSchedule = schedule[keys[i]];
        for (let j = 0; j < roberSchedule; j++) {
            timeLine.push({ first: convertToMinuts(roberSchedule[j].from), second: 1 });
            timeLine.push({ first: convertToMinuts(roberSchedule[j].to), second: -1 });
        }
    }
    addWorkingHoursToTimeLine(workingHours);
    timeLine.sort((a, b) => a.first - b.first);
    let approproateMoment = scanLine(duration, -1);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return approproateMoment !== -1;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (approproateMoment !== -1) {
                let time = сonvertminutsToFormat(approproateMoment, bankTimeZone);
                template.replace('%HH', time.hours.toString());
                template.replace('%MM', time.minuts.toString());
                template.replace('%DD', time.day);
                return template;
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let newApproproateMoment = scanLine(duration, approproateMoment);
            if (newApproproateMoment !== -1) {
                approproateMoment = newApproproateMoment;
                return true;
            }

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

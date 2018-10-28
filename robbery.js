'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

let timeLine = [];

function convDayToMin(day) {
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

function convMinFormat(minuts, bankTimeZone) {
    minuts += bankTimeZone * 60;
    let day = Math.trunc(minuts / (24 * 60));
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

function convToMin(timeString) {
    let minuts = 0;
    minuts += convDayToMin(timeString.slice(0, 2));
    let hours = parseInt(timeString.match('(\\d\\d):(\\d\\d)')[1]);
    minuts += parseInt(timeString.match('(\\d\\d):(\\d\\d)')[2]);
    let timeZone = parseInt(timeString.match('\\+(\\d)')[1]);
    minuts += (hours - timeZone) * 60;

    return minuts;
}

function addWorkingHoursToTimeLine(workingHours) {
    timeLine.push({ first: convToMin('ПН ' + workingHours.from), second: 1 });
    timeLine.push({ first: convToMin('ПН ' + workingHours.to), second: -1 });
    timeLine.push({ first: convToMin('ВТ ' + workingHours.from), second: 1 });
    timeLine.push({ first: convToMin('ВТ ' + workingHours.to), second: -1 });
    timeLine.push({ first: convToMin('СР ' + workingHours.from), second: 1 });
    timeLine.push({ first: convToMin('СР ' + workingHours.to), second: -1 });
}

function scanLine(duration, lastAppropriateMoment) {
    let notBusy = 0;
    for (let i = 0; i < timeLine.length - 1; i++) {
        notBusy += timeLine[i].second;
        if (notBusy === 4 &&
            timeLine[i + 1].first - timeLine[i].first > duration &&
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

function getAppMoment(schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    let bankTimeZone = parseInt(workingHours.from.match('\\+(\\d)')[1]);
    let keys = Object.keys(schedule);
    for (let i = 0; i < keys.length; i++) {
        let roberSchedule = schedule[keys[i]];
        for (let j = 0; j < roberSchedule.length; j++) {
            timeLine.push({ first: convToMin(roberSchedule[j].from), second: 1 });
            timeLine.push({ first: convToMin(roberSchedule[j].to), second: -1 });
        }
    }
    addWorkingHoursToTimeLine(workingHours);
    timeLine.sort((a, b) => a.first - b.first);
    let appMoment = scanLine(duration, -1);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return appMoment !== -1;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (appMoment !== -1) {
                let time = convMinFormat(appMoment, bankTimeZone);
                let answer = template.replace(/%HH/, time.hours.toString())
                    .replace(/%MM/gi, time.minuts.toString())
                    .replace(/%DD/gi, time.day);

                return answer;
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let newAppMoment = scanLine(duration, appMoment);
            if (newAppMoment !== -1) {
                appMoment = newAppMoment;

                return true;
            }

            return false;
        }
    };
}

module.exports = {
    getAppMoment,

    isStar
};

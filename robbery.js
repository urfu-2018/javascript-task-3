'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;



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

function convertToMinuts(timeString) {
    let minuts = 0;
    minuts += convertDayToMinuts(timeString.slice(0, 2));
    let hours = parseInt(timeString.match('(\\d\\d):(\\d\\d)')[1]);
    minuts += parseInt(timeString.match('(\\d\\d):(\\d\\d)')[2]);
    let timeZone = parseInt(timeString.match('\\+(\\d)')[1]);
    minuts += (hours - timeZone) * 60;

    return minuts;
}

function addWorkingHoursToTimeLine(timeLine, workingHours) {
    timeLine.push({ first: convertToMinuts('ПН ' + workingHours.from), second: 3 });
    timeLine.push({ first: convertToMinuts('ПН ' + workingHours.to), second: -3 });
    timeLine.push({ first: convertToMinuts('ВТ ' + workingHours.from), second: 3 });
    timeLine.push({ first: convertToMinuts('ВТ ' + workingHours.to), second: -3 });
    timeLine.push({ first: convertToMinuts('СР ' + workingHours.from), second: 3 });
    timeLine.push({ first: convertToMinuts('СР ' + workingHours.to), second: -3 });
}

function scanLine(timeLine, duration, lastAppropriateMoment) {
    let busy = 0;
    for (let i = 0; i < timeLine.length - 1; i++) {
        busy += timeLine[i].second;
        if (busy === 3 &&
            (timeLine[i + 1].first - timeLine[i].first) >= duration &&
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
    let timeLine = [];
    console.info(schedule, duration, workingHours);
    let bankTimeZone = parseInt(workingHours.from.match('\\+(\\d)')[1]);
    let keys = Object.keys(schedule);
    for (let i = 0; i < keys.length; i++) {
        let roberSchedule = schedule[keys[i]];
        for (let j = 0; j < roberSchedule.length; j++) {
            timeLine.push({ first: convertToMinuts(roberSchedule[j].from), second: -1 });
            timeLine.push({ first: convertToMinuts(roberSchedule[j].to), second: 1 });
        }
    }
    addWorkingHoursToTimeLine(timeLine, workingHours);
    timeLine.sort((a, b) => a !== b ? a.first - b.first : b.second - a.second);
    let approproateMoment = scanLine(timeLine, duration, -1);
    timeLine: timeLine;
    approproateMoment: approproateMoment;
    
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
                let hours;
                let minuts;
                if (time.hours < 10) {
                    hours = '0' + time.hours.toString();
                } else {
                    hours = time.hours.toString();
                }
                if (time.minuts < 10) {
                    minuts = '0' + time.minuts.toString();
                } else {
                    minuts = time.minuts.toString();
                }
                
                let answer = template.replace(/%HH/, hours)
                    .replace(/%MM/gi, minuts)
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
            timeLine.push({ first: approproateMoment + 30, second: 0 });
            timeLine.sort((a, b) => a !== b ? a.first - b.first : b.second - a.second);
            let newApproproateMoment = scanLine(timeLine, duration, approproateMoment);
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

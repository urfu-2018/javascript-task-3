'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
const DAYS_KEYS= { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const NUMBER_KEYS = { 0: 'ПН', 1: 'ВТ', 2: 'СР', 3: 'ЧТ', 4: 'ПТ', 5: 'СБ', 6: 'ВС' };
const hoursInDays = 24;
const minutesInHour = 60;
const minutesInDay = hoursInDays * minutesInHour;

function getTimeZone(str) {
    return parseInt(str.match(/[+]\d+/).toString().substr(1));
}

function getHoursFromStr(str) {
    let hour = str.match(/\d+:/).toString();
    return parseInt(hour.substring(0,hour.length-1));
}

function getDayFromStr(str) {
    return str.match(/[А-Я]{2}/).toString();
}

function getMinutesFromStr(str) {
    let minute = str.match(/:\d+/).toString();
    return parseInt(minute.substr(1));
}

class Time {
    constructor(currentString) {
        this.currentString = currentString;
        this.day = getDayFromStr(currentString);
        this.dayIndex = DAYS_KEYS[this.day];
        this.hours = getHoursFromStr(currentString);
        this.minutes = getMinutesFromStr(currentString);
        this.delta = getTimeZone(currentString);
    }

    convertStringToMinutes(bankTimeZone) {
        return this.dayIndex * minutesInDay
        + this.hours * minutesInHour
        + this.minutes
        + (bankTimeZone - this.delta) * minutesInHour;
    }
}

class DeltaTime {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }
}

function findRoberyTime(schedule, duration, workingHours) {
    let intervals = [];
    const bankTimeZone = getTimeZone(workingHours.from);
    for (let human in schedule) {
        for (let param of schedule[human]) {
            console.info(param);
            let timeFrom = (new Time(param.from)).convertStringToMinutes(bankTimeZone);
            let timeTo = (new Time(param.to)).convertStringToMinutes(bankTimeZone);
            let deltaTime = new DeltaTime(timeFrom, timeTo);
            intervals.push(deltaTime);
        }
    }
    console.info(intervals);
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
    //console.info(schedule, duration, workingHours);
    
    findRoberyTime(schedule, duration, workingHours);
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

module.exports = {
    getAppropriateMoment,

    isStar
};

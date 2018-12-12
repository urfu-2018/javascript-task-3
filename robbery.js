'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
const DAYS_KEYS = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const NUMBER_KEYS = { 0: 'ПН', 1: 'ВТ', 2: 'СР', 3: 'ЧТ', 4: 'ПТ', 5: 'СБ', 6: 'ВС' };
const HOURS_IN_DAYS = 24;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = HOURS_IN_DAYS * MINUTES_IN_HOUR;

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
        return this.dayIndex * MINUTES_IN_DAY +
        this.hours * MINUTES_IN_HOUR +
        this.minutes +
        (bankTimeZone - this.delta) * MINUTES_IN_HOUR;
    }
}

class Interval {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }

    isIntersecPoint(point) {
        return point >= this.from && point <= this.to;
    }

    isInInterval(interval) {
        return this.from >= interval.from && this.to <= interval.to;
    }
}

function getTimeZone(str) {
    return parseInt(str.match(/[+]\d+/).toString()
        .substr(1));
}

function getHoursFromStr(str) {
    let hour = str.match(/\d+:/).toString();

    return parseInt(hour.substring(0, hour.length - 1));
}

function getDayFromStr(str) {
    let day = str.match(/[А-Я]{2}/);
    if (day === null) {
        return NUMBER_KEYS[0];
    }

    return day.toString();
}

function getMinutesFromStr(str) {
    let minute = str.match(/:\d+/).toString();

    return parseInt(minute.substr(1));
}

function getArrayOfIntervals(freeInterval, interval) {
    let intersectLeft = freeInterval.isIntersecPoint(interval.from);
    let intersectRight = freeInterval.isIntersecPoint(interval.to);

    if (intersectLeft) {
        if (intersectRight) {
            return [new Interval(freeInterval.from, interval.from),
                new Interval(interval.to, freeInterval.to)];
        }

        return [new Interval(freeInterval.from, interval.from)];
    }
    if (!intersectLeft && intersectRight) {
        return [new Interval(interval.to, freeInterval.to)];
    }
    if (freeInterval.isInInterval(interval)) {
        return [];
    }

    return [freeInterval];
}

function calculateInterval(freeIntervals, intervals) {
    for (let interval of intervals) {
        calculateInversia(freeIntervals, interval);
    }
}

function calculateInversia(freeIntervals, interval) {
    for (let i = 0; i < freeIntervals.length;) {
        let temp = getArrayOfIntervals(freeIntervals[i], interval);
        freeIntervals.splice(i, 1);
        for (let j = 0; j < temp.length; j++) {
            freeIntervals.splice(i + j, 0, temp[j]);
        }
        i += temp.length + 1;
    }
}

function convertStrToDeltaTime(param, bankTimeZone) {
    let timeFrom = (new Time(param.from)).convertStringToMinutes(bankTimeZone);
    let timeTo = (new Time(param.to)).convertStringToMinutes(bankTimeZone);

    return new Interval(timeFrom, timeTo);
}

function niceRofl(obj, intervals, bankTimeZone) {
    for (let param of obj) {
        let deltaTime = convertStrToDeltaTime(param, bankTimeZone);
        intervals.push(deltaTime);
    }
}

function getIntervalsFromSchedlue(schedule, bankTimeZone) {
    let intervals = [];
    for (let human in schedule) {
        if (schedule.hasOwnProperty(human)) {
            niceRofl(schedule[human], intervals, bankTimeZone);
        }
    }

    return intervals;
}

function checkFreeIntervals(freeIntervals, duration) {
    for (let freeInterval of freeIntervals) {
        let delta = freeInterval.to - freeInterval.from;
        if (delta >= duration) {
            return freeInterval;
        }
    }

    return false;
}

function findRoberyTime(schedule, duration, workingHours) {
    const bankTimeZone = getTimeZone(workingHours.from);
    let intervals = getIntervalsFromSchedlue(schedule, bankTimeZone);
    let bankInterval = convertStrToDeltaTime(workingHours, bankTimeZone);
    let freeIntervals = [];
    for (let i = 0; i < 3; i++) {
        freeIntervals.push(new Interval(bankInterval.from +
            i * MINUTES_IN_DAY, bankInterval.to + i * MINUTES_IN_DAY));
    }
    calculateInterval(freeIntervals, intervals);

    return checkFreeIntervals(freeIntervals, duration);
}

function convertToResultAnswer(time, template) {
    let dayIndex = Math.floor(time / MINUTES_IN_DAY);
    let day = NUMBER_KEYS[dayIndex];
    let hour = Math.floor((time - MINUTES_IN_DAY * dayIndex) / MINUTES_IN_HOUR);
    let minutes = time - MINUTES_IN_DAY * dayIndex - hour * MINUTES_IN_HOUR;
    minutes = minutes > 10 ? minutes : '0' + minutes.toString();
    template = template
        .replace('%DD', day)
        .replace('%HH', hour)
        .replace('%MM', minutes);

    return template;
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
    let resultOfFunction = findRoberyTime(schedule, duration, workingHours);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (resultOfFunction === false) {
                return false;
            }

            return true;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!resultOfFunction) {
                return '';
            }

            return convertToResultAnswer(resultOfFunction.from, template);
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

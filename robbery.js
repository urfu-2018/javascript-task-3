'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const minInHour = 60;
const minInDay = minInHour * 24;

const timeRegex = new RegExp('([А-Я]{2}) (\\d{2}):(\\d{2})\\+(\\d+)');
const bankTimeRegex = new RegExp('(\\d{2}):(\\d{2})\\+(\\d+)');
const dayToMinutesShith = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3 };
class Interval {
    constructor(leftPoint, rightPoint) {
        this.leftPoint = leftPoint;
        this.rightPoint = rightPoint;
    }

    get length() {
        return this.rightPoint - this.leftPoint;
    }
}
Interval.prototype.toString = function intervalToString() {
    var ret = this.leftPoint + ' ' + this.rightPoint;

    return ret;
};

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

function parseTimeIntevalToMinRelativeMonday(interval, bankShift) {
    const match = timeRegex.exec(interval);
    const day = match[1];
    const shift = parseInt(match[4]);
    const deltaShift = bankShift - shift;
    const result = minInDay * dayToMinutesShith[day] +
        parseInt(match[2]) * minInHour + parseInt(match[3]) + deltaShift * minInHour;

    return result;
}

function parseBankTime(time) {
    const matchFrom = bankTimeRegex.exec(time.from);
    const matchTo = bankTimeRegex.exec(time.to);
    const fromMin = parseInt(matchFrom[1]) * minInHour + parseInt(matchFrom[2]);
    const toMin = parseInt(matchTo[1]) * minInHour + parseInt(matchTo[2]);

    return { from: fromMin, to: toMin, shift: parseInt(matchFrom[3]) };
}

function getIntervalsForPerson(intervalsArray, bankShift) {
    const result = [];
    for (var interval of intervalsArray) {
        const leftPoint = parseTimeIntevalToMinRelativeMonday(interval.from, bankShift);
        const rightPoint = parseTimeIntevalToMinRelativeMonday(interval.to, bankShift);
        result.push(new Interval(leftPoint, rightPoint));
    }

    return result;
}

function reverseIntervals(intervals) {
    const result = [];
    let prevRightPoint = 0;
    for (let interval of intervals) {
        result.push(new Interval(prevRightPoint, interval.leftPoint));
        prevRightPoint = interval.rightPoint;
    }
    result.push(new Interval(prevRightPoint, 4320));

    return result;
}

function getBankOpenIntervals(bankInterval) {
    const result = [];
    for (var i = 0; i < 3; i++) {
        result.push(new Interval(bankInterval.from + i * minInDay,
            bankInterval.to + i * minInDay
        ));
    }

    return result;
}
function findIntersectionOfAllGroups(intervals, duration) {
    var a = findIntersectionsTwoGroupsOfIntervals(intervals[0], intervals[1], duration);
    var b = findIntersectionsTwoGroupsOfIntervals(a, intervals[2], duration);
    var c = findIntersectionsTwoGroupsOfIntervals(b, intervals[3], duration);

    return c;
}

function findIntersectionsTwoGroupsOfIntervals(firstIntervals, secondIntervals, duration) {
    let result = [];
    for (let firstInterval of firstIntervals) {
        for (let secondIntrval of secondIntervals) {
            checkIntervalsPartialIntersection(firstInterval, secondIntrval, duration, result);
            checkIntervalsFullIntersection(firstInterval, secondIntrval, duration, result);
            checkIntervalsPartialIntersection(secondIntrval, firstInterval, duration, result);
            checkIntervalsFullIntersection(secondIntrval, firstInterval, duration, result);
        }
    }

    return result;
}

function checkIntervalsPartialIntersection(first, second, duration, result) {
    if (first.leftPoint <= second.leftPoint && first.rightPoint <= second.rightPoint) {
        const currInterval = new Interval(second.leftPoint, first.rightPoint);
        if (currInterval.length >= duration) {
            result.push(currInterval);
        }
    }
}

function checkIntervalsFullIntersection(first, second, duration, result) {
    if (first.leftPoint >= second.leftPoint && first.rightPoint <= second.rightPoint) {
        if (first.length >= duration) {
            result.push(first);
        }
    }
}

function div(val, by) {
    return (val - val % by) / by;
}

function getDateTimeFromMinutes(minutes) {
    for (const day of ['СР', 'ВТ', 'ПН']) {
        const minutesInCurrentDay = dayToMinutesShith[day] * minInDay;
        if (minutes >= minutesInCurrentDay) {
            const hours = toTwoDigitNumber(div((minutes - minutesInCurrentDay), minInHour));
            const min = toTwoDigitNumber((minutes - minutesInCurrentDay) % minInHour);

            return { day, hours: hours, minutes: min };
        }
    }
}
function toTwoDigitNumber(digit) {
    if (digit < 10) {
        return `0${digit.toString()}`;
    }

    return digit;
}

function removeDuplicates(arr) {
    const names = new Set();

    return arr.filter(item => !names.has(item.toString())
        ? names.add(item.toString()) : false);

}

function getAdditionTimes(intervals, duration) {
    const result = [];
    for (const interval of intervals) {
        let currLeftPart = interval.leftPoint;
        while (currLeftPart <= interval.rightPoint &&
            interval.rightPoint - currLeftPart >= duration) {
            result.push(new Interval(currLeftPart, interval.rightPoint));
            currLeftPart += 30;
        }
    }

    return result;
}
function getAppropriateMoment(schedule, duration, workingHours) {
    const bankInterval = parseBankTime(workingHours);
    const dannyIntervals = reverseIntervals(getIntervalsForPerson(schedule.Danny,
        bankInterval.shift));
    const rustyIntervals = reverseIntervals(getIntervalsForPerson(schedule.Rusty,
        bankInterval.shift));
    const linusIntervals = reverseIntervals(getIntervalsForPerson(schedule.Linus,
        bankInterval.shift));
    const bankIntervals = getBankOpenIntervals(bankInterval);
    const arr = [dannyIntervals, rustyIntervals, linusIntervals, bankIntervals];
    let res = findIntersectionOfAllGroups(arr, duration);
    res = removeDuplicates(res);
    res = getAdditionTimes(res, duration);
    let pointer = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return pointer < res.length;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (res.length === 0) {
                return '';
            }
            const date = getDateTimeFromMinutes(res[pointer].leftPoint);
            let result = template.replace('%DD', date.day);
            result = result.replace('%HH', date.hours);
            result = result.replace('%MM', date.minutes);

            return result;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (pointer < res.length - 1) {
                pointer++;

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

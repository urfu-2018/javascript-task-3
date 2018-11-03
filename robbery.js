'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const minInHour = 60;
const minInDay = minInHour * 24;
const thirty = 30;
const timeRegex = /([А-Я]{2}) (\d{2}):(\d{2})\+(\d+)/;
const bankTimeRegex = /(\d{2}):(\d{2})\+(\d+)/;
const daysForRobbery = ['СР', 'ВТ', 'ПН'];
const dayToMinutesShith = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3 };

class Interval {
    constructor(leftPoint, rightPoint) {
        this.leftPoint = leftPoint;
        this.rightPoint = rightPoint;
    }

    get length() {
        return this.rightPoint - this.leftPoint;
    }

    toString() {
        return `${this.leftPoint} ${this.rightPoint}`;
    }
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

function parseTimeIntevalToMinRelativeMonday(interval, bankShift) {
    const match = interval.match(timeRegex);
    const day = match[1];
    const shift = parseInt(match[4]);
    const deltaShift = bankShift - shift;
    const result = minInDay * dayToMinutesShith[day] +
        parseInt(match[2]) * minInHour + parseInt(match[3]) + deltaShift * minInHour;

    return result;
}

function parseBankTime(time) {
    const from = time.from.match(bankTimeRegex);
    const to = time.to.match(bankTimeRegex);
    const fromMin = parseInt(from[1]) * minInHour + parseInt(from[2]);
    const toMin = parseInt(to[1]) * minInHour + parseInt(to[2]);

    return { from: fromMin, to: toMin, shift: parseInt(from[3]) };
}

function getIntervalsForPerson(intervals, bankShift) {
    const result = [];
    for (var interval of intervals) {
        const from = parseTimeIntevalToMinRelativeMonday(interval.from, bankShift);
        const to = parseTimeIntevalToMinRelativeMonday(interval.to, bankShift);
        result.push(new Interval(from, to));
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
    result.push(new Interval(prevRightPoint, dayToMinutesShith['ЧТ'] * minInDay));

    return result;
}

function getBankOpenIntervals(bankInterval) {
    const result = [];
    for (var i = 0; i < daysForRobbery.length; i++) {
        result.push(new Interval(bankInterval.from + i * minInDay,
            bankInterval.to + i * minInDay
        ));
    }

    return result;
}

function findIntersectionOfAllGroups(intervals, duration) {
    let currentIntercestions = findIntersectionsTwoGroupsOfIntervals(intervals[0],
        intervals[1], duration);
    for (let i = 2; i < intervals.length; i++) {
        currentIntercestions = findIntersectionsTwoGroupsOfIntervals(
            currentIntercestions, intervals[i], duration);
    }

    return currentIntercestions;
}

function findIntersectionsTwoGroupsOfIntervals(firstGroup, secondGroup, duration) {
    let result = [];
    for (let firstInterval of firstGroup) {
        for (let secondIntrval of secondGroup) {
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

function getDateTimeFromMinutes(minRelativeWeekStart) {
    for (const day of daysForRobbery) {
        const minInCurrDay = dayToMinutesShith[day] * minInDay;
        if (minRelativeWeekStart >= minInCurrDay) {
            const hours = toTwoDigitNumber(div((minRelativeWeekStart - minInCurrDay), minInHour));
            const min = toTwoDigitNumber((minRelativeWeekStart - minInCurrDay) % minInHour);

            return { day, hours: hours, minutes: min };
        }
    }
}

function toTwoDigitNumber(digit) {
    return digit.toString().padStart(2, '0');
}

function removeDuplicates(arr) {
    const names = new Set();

    return arr.filter(item => !names.has(item.toString())
        ? names.add(item.toString()) : false);

}

function addAdditionTimes(intervals, duration) {
    const result = [];
    for (const interval of intervals) {
        let currLeftPart = interval.leftPoint;
        while (canShiftRobberyTime(currLeftPart, interval.rightPoint, duration)) {
            result.push(new Interval(currLeftPart, interval.rightPoint));
            currLeftPart += thirty;
        }
    }

    return result;
}

function canShiftRobberyTime(currLeftPart, rightPoint, duration) {
    return currLeftPart <= rightPoint && rightPoint - currLeftPart >= duration;
}

function getFreeTimeIntervals(participantSchedule, bankShift) {
    return reverseIntervals(getIntervalsForPerson(participantSchedule, bankShift));
}
function getAppropriateMoment(schedule, duration, workingHours) {
    const bankInterval = parseBankTime(workingHours);
    const participantIntervals = Object.keys(schedule)
        .filter(x => schedule[x].length !== 0)
        .map(part => getFreeTimeIntervals(schedule[part], bankInterval.shift));

    participantIntervals.push(getBankOpenIntervals(bankInterval));
    let availableIntervals = removeDuplicates(findIntersectionOfAllGroups(participantIntervals,
        duration));
    availableIntervals = addAdditionTimes(availableIntervals, duration);
    let pointer = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return pointer < availableIntervals.length;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (availableIntervals.length === 0) {
                return '';
            }
            const date = getDateTimeFromMinutes(availableIntervals[pointer].leftPoint);

            return template
                .replace('%DD', date.day)
                .replace('%HH', date.hours)
                .replace('%MM', date.minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (pointer < availableIntervals.length - 1) {
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

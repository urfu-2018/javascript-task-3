'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const MINUTE_PER_HOUR = 60;
const MINUTE_PER_DAY = 1440;
const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

function convertTime(time, newZone) {

    return toMinutes(time) + (newZone - Number(time.split('+')[1])) * MINUTE_PER_HOUR;
}

function toMinutes(time) {
    return days.indexOf(time.slice(0, 2)) * MINUTE_PER_DAY +
        Number(time.slice(3, 5)) * MINUTE_PER_HOUR +
        Number(time.slice(6, 8));
}

function toDateObject(minutes) {
    const day = Math.floor(minutes / MINUTE_PER_DAY);
    const hours = Math.floor((minutes - day * MINUTE_PER_DAY) / MINUTE_PER_HOUR);
    const minutesResult = minutes - (day * MINUTE_PER_DAY + hours * MINUTE_PER_HOUR);
    const newMinutes = `0${minutesResult}`.slice(-2);
    const newHours = `0${hours}`.slice(-2);

    return { day: days[day], hours: newHours, minutes: newMinutes };
}

function without(range1, range2) {
    return getFirstRange(range1, range2) ||
        getEmptyRange(range1, range2) ||
        getRangeOfFrom(range1, range2) ||
        [{ from: range2.to, to: range1.to }];
}

function getRangeOfFrom(range1, range2) {
    let result = [];
    if (range1.from <= range2.from) {
        result = [{ from: range1.from, to: range2.from }];
    }
    if (range2.to <= range1.to) {
        result.push({ from: range2.to, to: range1.to });
    }
    if (result.length === 0) {
        return false;
    }

    return result;
}

function getFirstRange(range1, range2) {
    if (range1.to <= range2.from || range2.to <= range1.from) {
        return [range1];
    }

    return false;
}

function getEmptyRange(range1, range2) {
    if (range2.from <= range1.from && range1.to <= range2.to) {
        return [null];
    }

    return false;
}

function replace(element, array, position, duration) {
    if (element && element.to - element.from >= duration) {
        array[position] = element;

        return 1;
    }
    array.splice(position, 1);

    return 0;
}

function getMomentForPair(goodTime, badTime, duration) {
    return badTime.reduce((goodTime2, bad) => {
        let i = 0;
        while (i < goodTime2.length) {
            let listOfGood = without(goodTime2[i], bad);
            let j = replace(listOfGood[0], goodTime2, i, duration);
            i = i + j;
            replace(listOfGood[1], goodTime2, goodTime2.length, duration);
        }

        return goodTime2;

    }, goodTime);
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    const listOfTimes = [];
    const bankZone = Number(workingHours.to.split('+')[1]);
    Object.keys(schedule).forEach(guy => {
        listOfTimes.push(schedule[guy].map(time => ({
            from: convertTime(time.from, bankZone),
            to: convertTime(time.to, bankZone) })
        ));
    });
    const goodTime = listOfTimes.reduce(
        (accum, currentValue) => getMomentForPair(accum, currentValue, duration), [
            { from: toMinutes('ПН ' + workingHours.from), to: toMinutes('ПН ' + workingHours.to) },
            { from: toMinutes('ВТ ' + workingHours.from), to: toMinutes('ВТ ' + workingHours.to) },
            { from: toMinutes('СР ' + workingHours.from), to: toMinutes('СР ' + workingHours.to) }
        ]).sort((obj1, obj2) => obj1.from - obj2.from);

    return {
        allMoments: goodTime,
        momentNumber: 0,
        duration: duration,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(this.allMoments[this.momentNumber]);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let time = this.allMoments[this.momentNumber];
            if (!time) {
                return '';
            }
            time = toDateObject(time.from);

            return template.replace('%DD', time.day)
                .replace('%HH', time.hours)
                .replace('%MM', time.minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let time = this.allMoments[this.momentNumber];
            if (!time) {
                return false;
            }
            if (time.to - time.from >= this.duration + 30) {
                this.allMoments[this.momentNumber] = {
                    from: time.from + 30,
                    to: time.to
                };

                return true;
            }
            let possibleNext = this.allMoments[this.momentNumber + 1];
            if (possibleNext && possibleNext.from - time.to >= 30) {
                this.momentNumber++;

                return true;
            }

            return false;
        }
    };
};

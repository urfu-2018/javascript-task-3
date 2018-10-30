'use strict';

const isStar = true;
const timeRegex = /([А-Я]{2})? ?(\d{2}):(\d{2})\+(\d)/;
let days = { 'ВТ': 1, 'СР': 2, 0: 'ПН', 1: 'ВТ', 2: 'СР' };

let reduceDim = array => [].concat.apply([], array);

let toOneDimArray = threeDimArray => reduceDim(reduceDim(threeDimArray));

let getPoint = (type, time, timezone) => ({ type: type, time: getMinutes(time, timezone) });

let getBankInterval = (hours, timezone) =>
    ({ from: getMinutes(hours.from, timezone), to: getMinutes(hours.to, timezone) });

let getIntervalPoints = (schedule, timezone) =>
    Object.values(schedule).map(
        person => person.map(
            interval => Object.entries(interval).map(
                point => getPoint(point[0], point[1], timezone))));

let getSortedTimePoints = (schedule, timezone) =>
    toOneDimArray(getIntervalPoints(schedule, timezone))
        .sort((a, b) => a.time - b.time);

function getFreeIntervals(points) {
    let intervals = [];
    let start = 0;
    let busy = 0;

    points.forEach(p => {
        if (!busy) {
            if (p.time % (24 * 60) < start % (24 * 60)) {
                intervals.push({ from: start, to: p.time - p.time % (24 * 60) - 1 });
                intervals.push({ from: p.time - p.time % (24 * 60), to: p.time });
            } else {
                intervals.push({ from: start, to: p.time });
            }
        }
        busy += p.type === 'from' ? 1 : -1;
        start = p.time;
    });
    intervals.push({ from: start, to: 3 * 24 * 60 - 1 });

    return intervals;
}

let getDay = (minutes) => Math.floor(minutes / (24 * 60));
let getHour = (minutes) => Math.floor(minutes / 60) % 24;
let getMinute = (minutes) => minutes % 60;
let twoDigit = (int) => int > 9 ? int : '0' + int;

function getAppropriateIntervals(freeIntervals, bankInterval, duration) {
    let day = 24 * 60;
    let intervals = [];

    freeIntervals.forEach(interval => {
        let start = bankInterval.from <= interval.from % day
            ? interval.from : getDay(interval.from) * day + bankInterval.from;
        let end = bankInterval.to >= interval.to % day
            ? interval.to : getDay(interval.to) * day + bankInterval.to;
        if (end - start >= duration) {
            intervals.push({
                from: start,
                to: end
            });
        }
    });

    return intervals;
}

function getMinutes(time, timezone) {
    let match = time.match(timeRegex);
    let day = days[match[1]] ? days[match[1]] : 0;
    let hours = parseInt(match[2]);
    let minutes = parseInt(match[3]);
    let localzone = parseInt(match[4]);

    return day * 24 * 60 + (hours - localzone + timezone) * 60 + minutes;
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
    let timezone = parseInt(workingHours.from.match(timeRegex)[4]);
    let points = getSortedTimePoints(schedule, timezone);
    let bankInterval = getBankInterval(workingHours, timezone);
    let freeIntervals = getFreeIntervals(points);
    let robIntervals = getAppropriateIntervals(freeIntervals, bankInterval, duration);

    return {
        duration: duration,
        intervals: robIntervals,
        currentIndex: 0,
        currentTime: robIntervals[0] ? robIntervals[0].from : NaN,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robIntervals[0] !== undefined;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return !this.exists() ? '' : template
                .replace('%HH', twoDigit(getHour(this.currentTime)))
                .replace('%MM', twoDigit(getMinute(this.currentTime)))
                .replace('%DD', days[getDay(this.currentTime)]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }
            if (this.currentTime + 30 + duration <= this.intervals[this.currentIndex].to) {
                this.currentTime += 30;

                return true;
            }
            if (this.currentIndex + 1 < this.intervals.length) {
                this.currentIndex++;
                this.currentTime = this.intervals[this.currentIndex].from;

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

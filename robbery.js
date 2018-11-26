'use strict';

const isStar = true;
const TIME_REGEX = /([А-Я]{2})? ?(\d{2}):(\d{2})\+(\d)/;
const Days = { 'ВТ': 1, 'СР': 2, 0: 'ПН', 1: 'ВТ', 2: 'СР' };
const MINUTES_IN_DAY = 24 * 60;
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MAX_MINUTES_VALUE = 3 * MINUTES_IN_DAY - 1;
const NEXT_TRY_MINUTES = 30;

let getPoint = (type, time, timezone) => ({ type: type, time: getMinutes(time, timezone) });

let getBankInterval = (hours, timezone) =>
    ({ from: getMinutes(hours.from, timezone), to: getMinutes(hours.to, timezone) });

let getSortedTimePoints = (schedule, timezone) =>
    getIntervalPoints(schedule, timezone)
        .sort((a, b) => a.time - b.time);

function getIntervalPoints(schedule, timezone) {
    let points = [];

    Object.values(schedule).forEach(personSchedule => {
        personSchedule.forEach(interval => {
            points.push(getPoint('from', interval.from, timezone));
            points.push(getPoint('to', interval.to, timezone));
        });
    });

    return points;
}

function getFreeIntervals(points) {
    let intervals = [];
    let start = 0;
    let busy = 0;

    points.forEach(point => {
        if (!busy) {
            if (point.time % (MINUTES_IN_DAY) < start % (MINUTES_IN_DAY)) {
                intervals.push({
                    from: start, to:
                    point.time - point.time % (MINUTES_IN_DAY) - 1
                });
                intervals.push({
                    from: point.time - point.time % (MINUTES_IN_DAY),
                    to: point.time
                });
            } else {
                intervals.push({ from: start, to: point.time });
            }
        }
        busy += point.type === 'from' ? 1 : -1;
        start = point.time;
    });
    intervals.push({ from: start, to: MAX_MINUTES_VALUE });

    return intervals;
}

let getDay = (minutes) => Math.floor(minutes / (MINUTES_IN_DAY));
let getHour = (minutes) => Math.floor(minutes / MINUTES_IN_HOUR) % HOURS_IN_DAY;
let getMinute = (minutes) => minutes % MINUTES_IN_HOUR;
let twoDigit = (int) => int > 9 ? int : '0' + int;

function getAppropriateIntervals(freeIntervals, bankInterval, duration) {
    let intervals = [];

    freeIntervals.forEach(interval => {
        let start = bankInterval.from <= interval.from % MINUTES_IN_DAY
            ? interval.from : getDay(interval.from) * MINUTES_IN_DAY + bankInterval.from;
        let end = bankInterval.to >= interval.to % MINUTES_IN_DAY
            ? interval.to : getDay(interval.to) * MINUTES_IN_DAY + bankInterval.to;
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
    let match = time.match(TIME_REGEX);
    let day = Days[match[1]] ? Days[match[1]] : 0;
    let parts = match
        .slice(2)
        .map(str => parseInt(str));

    return day * MINUTES_IN_DAY + (parts[0] - parts[2] + timezone) * MINUTES_IN_HOUR + parts[1];
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
    let timezone = parseInt(workingHours.from.match(TIME_REGEX)[4]);
    let points = getSortedTimePoints(schedule, timezone);
    let bankInterval = getBankInterval(workingHours, timezone);
    let freeIntervals = getFreeIntervals(points);
    let robIntervals = getAppropriateIntervals(freeIntervals, bankInterval, duration);

    return {
        duration: duration,
        intervals: robIntervals,
        index: 0,
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
                .replace('%DD', Days[getDay(this.currentTime)]);
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
            if (this.currentTime + NEXT_TRY_MINUTES + duration <= this.intervals[this.index].to) {
                this.currentTime += NEXT_TRY_MINUTES;

                return true;
            }
            if (this.index + 1 < this.intervals.length) {
                this.index++;
                this.currentTime = this.intervals[this.index].from;

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

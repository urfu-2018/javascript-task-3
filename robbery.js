'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const bankTimeZone = parseInt(workingHours.from.split('+')[1]);
    const result = findRoberyTime(schedule, duration, workingHours);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(result);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return ticksToDate(result, template, bankTimeZone);
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

const weekToNum = { ПН: 1, ВТ: 2, СР: 3, ЧТ: 4, ПТ: 5, СБ: 6, ВС: 7 };

/**
 * @param {String} date – Дата, например, "ПН 12:00+5"
 * @returns {Date}
 */
function dateToTicks(date) {
    const [week, time] = date.split(' ');

    return Date.parse(`2018 10 ${weekToNum[week]} ${time}`);
}

/**
 * @param {[]} intervals
 * @returns {[]}
 */
function unionOfIntervals(intervals) {
    intervals = intervals.sort((x, y) => x[0] > y[0]);
    const result = [intervals[0]];
    for (let interval of intervals.slice(1)) {
        if (result[result.length - 1][1] < interval[0]) {
            result.push(interval);
        } else if (result[result.length - 1][1] < interval[1]) {
            result[result.length - 1][1] = interval[1];
        }
    }

    return result;
}

/**
 * @param {int} start
 * @param {[]} intervals
 * @param {int} end
 * @returns {[]}
 */
function invertIntervals(start, intervals, end) {
    intervals = intervals.sort((x, y) => x[0] > y[0]).reduce((a, b) => a.concat(b), []);
    if (intervals[0] === start) {
        intervals.shift();
    } else {
        intervals.unshift(start);
    }
    if (intervals.slice(-1) === end) {
        intervals.pop();
    } else {
        intervals.push(end);
    }

    return intervals
        .reduce((a, c, i) => a.concat(i % 2 ? [[intervals[i - 1], c]] : []), [])
        .filter(x => x[0] !== x[1] && x[0] < x[1]);
}

function scheduleToTimeIntervals(schedule) {
    const result = [];
    for (let interval of schedule) {
        result.push([dateToTicks(interval.from), dateToTicks(interval.to)]);
    }

    return result;
}

const numToWeek = { 1: 'ПН', 2: 'ВТ', 3: 'СР', 4: 'ЧТ', 5: 'ПТ', 6: 'СБ', 7: 'ВС' };

function ticksToDate(ticks, format = '%DD %HH:%MM', timeZone = 5) {
    if (!ticks) {
        return '';
    }
    const date = new Date(ticks + timeZone * 3600 * 1000);
    let hours = parseInt(date.getUTCHours());
    let minutes = parseInt(date.getUTCMinutes());
    if (hours < 10) {
        hours = '0' + hours;
    }
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    const week = numToWeek[date.getUTCDay()];

    return format
        .replace('%DD', week)
        .replace('%HH', hours)
        .replace('%MM', minutes);
}

function findGoodIntervals(schedule, workingHours) {
    const bankSchedule = [
        { from: 'ПН ' + workingHours.from, to: 'ПН ' + workingHours.to },
        { from: 'ВТ ' + workingHours.from, to: 'ВТ ' + workingHours.to },
        { from: 'СР ' + workingHours.from, to: 'СР ' + workingHours.to }
    ];
    const minTime = dateToTicks('ПН ' + workingHours.from);
    const maxTime = dateToTicks('СР ' + workingHours.to);

    return invertIntervals(
        minTime,
        unionOfIntervals(
            invertIntervals(minTime, scheduleToTimeIntervals(bankSchedule), maxTime).concat(
                scheduleToTimeIntervals(
                    schedule.Danny.concat(schedule.Rusty).concat(schedule.Linus)
                )
                    .filter(x => x[0] < maxTime)
                    .map(x => (x[1] > maxTime ? [x[0], maxTime] : x))
            )
        ),
        maxTime
    );
}

function findRoberyTime(schedule, duration, workingHours) {
    const durationTicks = new Date(new Date(0).setMinutes(duration));
    for (let interval of findGoodIntervals(schedule, workingHours)) {
        if (interval[1] - interval[0] >= durationTicks) {
            return interval[0];
        }
    }

    return null;
}
invertIntervals(0, [0, 10], 10); // ?
module.exports = {
    getAppropriateMoment,
    findGoodIntervals,
    findRoberyTime,
    dateToTicks,
    ticksToDate,
    scheduleToTimeIntervals,
    isStar
};

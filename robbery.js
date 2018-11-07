'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
const weekToNum = { ПН: 1, ВТ: 2, СР: 3, ЧТ: 4, ПТ: 5, СБ: 6, ВС: 7 };
const millisecondsInHour = 3600 * 1000;
const millisecondsInMinute = 60000;

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
    let oldResult = '';
    let result = findRoberyTime(schedule, duration, workingHours);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: () => Boolean(result),

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: template => ticksToDate(result || oldResult, template, bankTimeZone),

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (result) {
                return false;
            }

            const afterDelay = new Date(result + 30 * millisecondsInMinute).getTime();
            schedule.Danny.push({
                from: ticksToDate(result, '%DD %HH:%MM+' + 0, 0),
                to: ticksToDate(afterDelay, '%DD %HH:%MM+' + 0, 0)
            });
            const newMoment = getAppropriateMoment(schedule, duration, workingHours);
            if (!newMoment.result) {
                oldResult = result;
            }
            result = newMoment.result;

            return Boolean(result);
        },
        result
    };
}

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
    intervals = intervals.sort((x, y) => x.start - y.start);
    const result = [intervals[0]];

    for (const interval of intervals.slice(1)) {
        if (result[result.length - 1].end < interval.start) {
            result.push(interval);
        } else if (result[result.length - 1].end < interval.end) {
            result[result.length - 1].end = interval.end;
        }
    }

    return result;
}

/**
 * @param {[{start, end}, ]} intervals
 * @returns {[{start, end},]} инвертированые интервалы по отрезку
 */
function invertIntervals(intervals) {
    intervals = intervals
        .sort((x, y) => x.start > y.start)
        .reduce((a, b) => Object.values(a).concat(Object.values(b)), []);
    const minTime = dateToTicks('ПН 00:00+14');
    const maxTime = dateToTicks('СР 23:59+0');

    if (intervals[0] === minTime) {
        intervals.shift();
    } else {
        intervals.unshift(minTime);
    }
    if (intervals.slice(-1) === maxTime) {
        intervals.pop();
    } else {
        intervals.push(maxTime);
    }

    return intervals.reduce(
        (a, c, i) => a.concat(i % 2 ? [{ start: intervals[i - 1], end: c }] : []),
        []
    );
}

/**
 * @param {[]} schedule - расписание грабителей
 * @returns {[{start, end}, ]} - интервалы времени
 */
function scheduleToTimeIntervals(schedule) {
    const result = [];
    for (const interval of schedule) {
        result.push({ start: dateToTicks(interval.from), end: dateToTicks(interval.to) });
    }

    return result;
}

function ticksToDate(ticks, format = '%DD %HH:%MM', timeZone = 5) {
    if (!ticks) {
        return '';
    }
    const date = new Date(ticks + timeZone * millisecondsInHour);
    const hours = date.getUTCHours().toString();
    const minutes = date.getUTCMinutes().toString();
    const week = Object.keys(weekToNum)[date.getUTCDay() - 1];

    return format
        .replace(/%DD/gi, week)
        .replace(/%HH/gi, hours.padStart(2, '0'))
        .replace(/%MM/gi, minutes.padStart(2, '0'));
}

function findGoodIntervals(schedule, workingHours) {
    const bankSchedule = [
        { from: 'ПН ' + workingHours.from, to: 'ПН ' + workingHours.to },
        { from: 'ВТ ' + workingHours.from, to: 'ВТ ' + workingHours.to },
        { from: 'СР ' + workingHours.from, to: 'СР ' + workingHours.to }
    ];
    const robbersBusy = scheduleToTimeIntervals(
        schedule.Danny.concat(schedule.Rusty).concat(schedule.Linus)
    );
    const bankNotWorking = invertIntervals(scheduleToTimeIntervals(bankSchedule));

    return invertIntervals(unionOfIntervals(bankNotWorking.concat(robbersBusy)));
}

function findRoberyTime(schedule, duration, workingHours) {
    const durationTicks = new Date(new Date(0).setMinutes(duration));
    for (const interval of findGoodIntervals(schedule, workingHours)) {
        if (interval.end - interval.start >= durationTicks) {
            return interval.start;
        }
    }

    return null;
}

module.exports = {
    getAppropriateMoment,
    isStar
};

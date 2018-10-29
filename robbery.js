'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const numToWeek = { 1: 'ПН', 2: 'ВТ', 3: 'СР', 4: 'ЧТ', 5: 'ПТ', 6: 'СБ', 7: 'ВС' };
const weekToNum = { ПН: 1, ВТ: 2, СР: 3, ЧТ: 4, ПТ: 5, СБ: 6, ВС: 7 };

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
    let result = findRoberyTime(schedule, duration, workingHours);
    let answ = {};
    function updateAnswer(exists, format) {
        answ.exists = exists;
        answ.format = format;
    }

    answ = {

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
        format: template => ticksToDate(result, template, bankTimeZone),

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const start = new Date(result).getTime();
            const end = new Date(result + 30 * 60000).getTime();
            schedule.Danny.push({
                from: ticksToDate(start, '%DD %HH:%MM+' + bankTimeZone, bankTimeZone),
                to: ticksToDate(end, '%DD %HH:%MM+' + bankTimeZone, bankTimeZone)
            });
            const newMoment = getAppropriateMoment(schedule, duration, workingHours);
            if (newMoment.result) {
                updateAnswer(newMoment.exists, newMoment.format);
                result = newMoment.result;
            }

            return newMoment.result;
        },
        result
    };

    return answ;
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
    intervals = intervals.sort((x, y) => x[0] - y[0]);
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
 * @param {[]} intervals
 * @returns {[]}
 */
function invertIntervals(intervals) {
    intervals = intervals.sort((x, y) => x[0] > y[0]).reduce((a, b) => a.concat(b), []);
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

    return intervals.reduce((a, c, i) => a.concat(i % 2 ? [[intervals[i - 1], c]] : []), []);
}

function scheduleToTimeIntervals(schedule) {
    const result = [];
    for (let interval of schedule) {
        result.push([dateToTicks(interval.from), dateToTicks(interval.to)]);
    }

    return result;
}

function ticksToDate(ticks, format = '%DD %HH:%MM', timeZone = 5) {
    if (!ticks) {
        return '';
    }
    const date = new Date(ticks + timeZone * 3600 * 1000);
    const hours = date.getUTCHours().toString();
    const minutes = date.getUTCMinutes().toString();
    const week = numToWeek[date.getUTCDay()];

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
    for (let interval of findGoodIntervals(schedule, workingHours)) {
        if (interval[1] - interval[0] >= durationTicks) {
            return interval[0];
        }
    }

    return null;
}

module.exports = {
    getAppropriateMoment,
    isStar
};

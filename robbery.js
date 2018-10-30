'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const daysOfTheWeek = ['ПН', 'ВТ', 'СР'];
const minutesInHour = 60;
const minutesInDay = 24 * minutesInHour;

class TimeInterval {

    constructor(from, to) {
        this.from = from;
        this.to = to;
    }

    length() {
        return this.to - this.from;
    }

    getStart(timeZone) {
        let startInMinutes = this.from + timeZone * minutesInHour;
        let day = daysOfTheWeek[parseInt(startInMinutes / minutesInDay)];
        let hours = parseInt((startInMinutes % minutesInDay) / minutesInHour);
        let minutes = parseInt((startInMinutes % minutesInDay) % minutesInHour);

        return { day, hours, minutes };
    }

    intersects(otherInterval) {
        if (this.from > otherInterval.to || otherInterval.from > this.to) {
            return new TimeInterval(0, 0);
        }

        let start = Math.max(this.from, otherInterval.from);
        let end = Math.min(this.to, otherInterval.to);

        return new TimeInterval(start, end);
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
function getAppropriateMoment(schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);

    const shift = 30;
    let index = 0;

    let allIntervals = getRobberyFreeIntervals(workingHours, schedule)
        .filter(i => i.length() >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return allIntervals.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let bankTimeZone = parseInt(workingHours.from.slice(5));

            return (allIntervals.length > 0)
                ? formatTimeInterval(allIntervals[index], bankTimeZone, template)
                : '';
        },


        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (allIntervals.length === 0) {
                return false;
            }

            allIntervals[index].from += shift;
            if (allIntervals[index].length() >= duration) {
                return true;
            }

            if (index < allIntervals.length - 1) {
                index++;

                return true;
            }

            if (index < allIntervals.length) {
                allIntervals[index].from -= shift;
            }

            return false;

        }
    };
}

function getRobberyFreeIntervals(workingHours, schedule) {
    let bankTimeIntervals = [];
    for (const day of daysOfTheWeek) {
        bankTimeIntervals.push(new TimeInterval(
            parseTimeToMinutes(`${day} ${workingHours.from}`),
            parseTimeToMinutes(`${day} ${workingHours.to}`)));
    }

    let freeIntervals = getFreeIntervals(bankTimeIntervals, schedule.Danny);
    freeIntervals = getFreeIntervals(freeIntervals, schedule.Rusty);
    freeIntervals = getFreeIntervals(freeIntervals, schedule.Linus);

    return freeIntervals;
}

function getFreeIntervals(bankIntervals, robberySchedule) {
    let robberyIntervals = invertIntervals(robberySchedule.map(
        x => new TimeInterval(parseTimeToMinutes(x.from), parseTimeToMinutes(x.to)))
        .sort((a, b) => a.from > b.from));

    let intervals = [];
    for (const interval of bankIntervals) {
        for (const otherInterval of robberyIntervals) {
            intervals.push(interval.intersects(otherInterval));
        }
    }

    return intervals;
}


function invertIntervals(intervals) {
    let invertedIntervals = [];
    let lastEndPoint = 0;

    for (let i = 0; i < intervals.length; i++) {
        invertedIntervals.push(new TimeInterval(lastEndPoint, intervals[i].from));
        lastEndPoint = intervals[i].to;
    }
    invertedIntervals.push(
        new TimeInterval(lastEndPoint, (daysOfTheWeek.length + 1) * minutesInDay));

    return invertedIntervals;
}

function parseTimeToMinutes(time) {
    let dayOfWeek = daysOfTheWeek.indexOf(time.slice(0, 2));
    let hours = parseInt(time.slice(3, 5));
    let minutes = parseInt(time.slice(6, 8));
    let timeZone = parseInt(time.slice(8));

    return dayOfWeek * minutesInDay + hours * minutesInHour +
        minutes - timeZone * minutesInHour;
}

function formatTimeInterval(timeInterval, timeZone, template) {
    let start = timeInterval.getStart(timeZone);

    return template.replace('%DD', start.day)
        .replace('%HH', pad(start.hours))
        .replace('%MM', pad(start.minutes));
}

function pad(number) {
    var s = String(number);
    while (s.length < 2) {
        s = '0' + s;
    }

    return s;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

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
        let minutes = (startInMinutes % minutesInDay) % minutesInHour;

        return { day: day, hours: hours, minutes: minutes };
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

    let lastIndex = 0;
    let lastCorrectInterval;

    let allIntervals = getFreeIntervals(workingHours, schedule);

    for (let i = 0; i < allIntervals.length; i++) {
        if (allIntervals[i].length() >= duration) {
            lastIndex = i;
            lastCorrectInterval = allIntervals[i];
            break;
        }
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (lastCorrectInterval) {
                return true;
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let bankTimeZone = parseInt(workingHours.from.slice(5));

            return lastCorrectInterval
                ? formatTimeInterval(lastCorrectInterval, bankTimeZone, template)
                : '';
        },


        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            lastCorrectInterval.from += 30;
            for (let i = lastIndex; i < allIntervals.length; i++) {
                if (!(allIntervals[i].length() >= duration)) {
                    continue;
                }
                lastIndex = i;
                lastCorrectInterval = allIntervals[i];

                return true;

            }
            lastCorrectInterval.from -= 30;

            return false;

        }
    };
}

function getFreeIntervals(workingHours, schedule) {
    let bankTimeIntervals = [];
    for (let i = 0; i < daysOfTheWeek.length; i++) {
        bankTimeIntervals.push(new TimeInterval(
            parseTimeToMinutes(`${daysOfTheWeek[i]} ${workingHours.from}`),
            parseTimeToMinutes(`${daysOfTheWeek[i]} ${workingHours.to}`)));
    }

    let freeIntervals = getFreeTime(bankTimeIntervals, schedule.Danny);
    freeIntervals = getFreeTime(freeIntervals, schedule.Rusty);
    freeIntervals = getFreeTime(freeIntervals, schedule.Linus);

    return freeIntervals;
}

function getFreeTime(bankIntervals, schedule) {
    let busyTimeIntervals = schedule.map(x => new TimeInterval(parseTimeToMinutes(x.from),
        parseTimeToMinutes(x.to)));

    for (let i = 0; i < busyTimeIntervals.length; i++) {
        let diff = [];
        for (let j = 0; j < bankIntervals.length; j++) {
            diff = diff.concat(getDifference(bankIntervals[j], busyTimeIntervals[i]));
        }
        bankIntervals = diff;
    }

    return bankIntervals;
}

function getDifference(freeBankInterval, otherInterval) {
    if (freeBankInterval.to > otherInterval.to && otherInterval.from > freeBankInterval.from) {
        return [new TimeInterval(freeBankInterval.from, otherInterval.from),
            new TimeInterval(otherInterval.to, freeBankInterval.to)];
    }

    if (otherInterval.to < freeBankInterval.from || freeBankInterval.to < otherInterval.from) {
        return [freeBankInterval];
    }

    return getIfIntersection(freeBankInterval, otherInterval);
}

function getIfIntersection(freeBankInterval, otherInterval) {
    if (freeBankInterval.from < otherInterval.from || freeBankInterval.to < otherInterval.to) {
        return [new TimeInterval(freeBankInterval.from, otherInterval.from)];
    }

    if (freeBankInterval.from > otherInterval.from || freeBankInterval.to > otherInterval.to) {
        return [new TimeInterval(otherInterval.to, freeBankInterval.to)];
    }
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

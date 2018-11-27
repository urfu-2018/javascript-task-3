'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const WEEK_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MS_IN_DAY = 86400000;
const MS_IN_HOUR = 3600000;
const MS_IN_MIN = 60000;
const FIRST_DAY = 'ПН';
const LAST_DAY = 'СР';
const FIRST_DAY_NUMBER = getDayNumber(FIRST_DAY);
const LAST_DAY_NUMBER = getDayNumber(LAST_DAY);
const TRY_LATER_INTERVAL = 30 * MS_IN_MIN;

function getDayNumber(day) {
    return WEEK_DAYS.indexOf(day);
}

function getDayByNumber(dayNumber) {
    return WEEK_DAYS[dayNumber];
}

function getTimeDataset(timeString) {
    const timeMatch = timeString.match(/([а-я]{2})*\s*(\d{2}):(\d{2})\+(\d+)/i);

    const day = timeMatch[1];
    const dayNumber = (typeof day === 'undefined') ? 0 : getDayNumber(day);
    const hours = Number(timeMatch[2]);
    const mins = Number(timeMatch[3]);
    const timeZone = Number(timeMatch[4]);

    return {
        dayNumber,
        hours,
        mins,
        timeZone,

        setDayNumber: function (num) {
            this.dayNumber = num;

            return this;
        },

        setTimeZone: function (bankTimeZone) {
            if (bankTimeZone === timeZone) {
                return this;
            }

            this.hours += bankTimeZone - this.timeZone;

            if (this.hours < 0) {
                this.dayNumber--;
                this.hours = 24 + this.hours;
            }

            if (this.hours >= 24) {
                this.dayNumber++;
                this.hours = this.hours - 24;
            }

            if (this.dayNumber < 0) {
                this.dayNumber = WEEK_DAYS.length - 1;
            }

            if (this.dayNumber > WEEK_DAYS.length - 1) {
                this.dayNumber = 0;
            }

            this.timeZone = bankTimeZone;

            return this;
        },

        getTimeStamp: function () {
            return this.dayNumber * MS_IN_DAY +
                this.hours * MS_IN_HOUR +
                this.mins * MS_IN_MIN;
        }
    };
}

function timeStampToTime(timeStamp) {
    const dayNumber = parseInt(timeStamp / MS_IN_DAY);
    let hours = parseInt((timeStamp / MS_IN_HOUR) % 24);
    let mins = parseInt((timeStamp / MS_IN_MIN) % 60);

    const day = getDayByNumber(dayNumber);
    hours = (hours < 10) ? '0' + hours : String(hours);
    mins = (mins < 10) ? '0' + mins : String(mins);

    return { dayNumber, day, hours, mins };
}

function getFormattedTime(template, timeStamp) {
    const time = timeStampToTime(timeStamp);

    return template
        .replace('%DD', time.day)
        .replace('%HH', time.hours)
        .replace('%MM', time.mins);
}

function getBankDataset(workingHours) {
    let workingIntervals = [];
    for (let i = FIRST_DAY_NUMBER; i <= LAST_DAY_NUMBER; i++) {
        let from = getTimeDataset(workingHours.from)
            .setDayNumber(i)
            .getTimeStamp();

        let to = getTimeDataset(workingHours.to)
            .setDayNumber(i)
            .getTimeStamp();

        workingIntervals.push({ from, to });
    }

    const timeZone = getTimeDataset(workingHours.from).timeZone;
    const firstFrom = workingIntervals[0].from;
    const lastTo = workingIntervals[workingIntervals.length - 1].to;

    let nonWorkingIntervals = [];
    workingIntervals.reduce((prev, curr) => {
        nonWorkingIntervals.push({ from: prev.to, to: curr.from });

        return curr;
    });

    return {
        firstFrom,
        lastTo,
        timeZone,
        workingIntervals,
        nonWorkingIntervals
    };
}

function getSortedSchedule(schedule, bankDataset) {
    let unionSchedule = schedule.Danny
        .concat(schedule.Rusty)
        .concat(schedule.Linus);

    return unionSchedule
        .map((interval) => {
            let from = getTimeDataset(interval.from)
                .setTimeZone(bankDataset.timeZone)
                .getTimeStamp();

            let to = getTimeDataset(interval.to)
                .setTimeZone(bankDataset.timeZone)
                .getTimeStamp();

            return { from, to };
        })
        .filter(interval => {
            let from = interval.from;
            let to = interval.to;
            let firstFrom = bankDataset.firstFrom;
            let lastTo = bankDataset.lastTo;

            return to > firstFrom && from < lastTo;
        })
        .map(interval => {
            let from = interval.from;
            let to = interval.to;
            let firstFrom = bankDataset.firstFrom;
            let lastTo = bankDataset.lastTo;

            return {
                from: (from <= firstFrom) ? firstFrom : from,
                to: (to >= lastTo) ? lastTo : to
            };
        })
        .concat(bankDataset.nonWorkingIntervals)
        .sort((a, b) => a.from - b.from);
}

function getMergedSchedule(schedule, bankDataset) {
    const sortedSchedule = getSortedSchedule(schedule, bankDataset);

    let mergedSchedule = [];

    sortedSchedule.reduce((prev, curr, i, arr) => {
        let isLast = i === arr.length - 1;

        let prevFrom = prev.from;
        let prevTo = prev.to;

        let currFrom = curr.from;
        let currTo = curr.to;

        curr = {
            from: (currFrom > prevTo) ? currFrom : prevFrom,
            to: (currTo > prevTo) ? currTo : prevTo
        };

        if (currFrom > prevTo) {
            mergedSchedule.push(prev);
        }

        if (isLast) {
            mergedSchedule.push(curr);
        }

        return curr;
    });

    return mergedSchedule;
}

function getRobberyIntervals(schedule, bankDataset) {
    const mergedSchedule = getMergedSchedule(schedule, bankDataset);

    let robberyIntervals = [];
    mergedSchedule.reduce((prev, curr, i, arr) => {
        let isFirst = i === 1;
        let isLast = i === arr.length - 1;

        if (isFirst && prev.from > bankDataset.firstFrom) {
            robberyIntervals.push({ from: bankDataset.firstFrom, to: prev.from });
        }

        robberyIntervals.push({ from: prev.to, to: curr.from });

        if (isLast && curr.to < bankDataset.lastTo) {
            robberyIntervals.push({ from: curr.to, to: bankDataset.lastTo });
        }

        return curr;
    });

    return robberyIntervals;
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

    duration *= MS_IN_MIN;

    const bankDataset = getBankDataset(workingHours);
    const robberyIntervals = getRobberyIntervals(schedule, bankDataset);

    const filteredIntervals = robberyIntervals.filter(interval => {
        return interval.to - interval.from >= duration;
    });

    const exists = filteredIntervals.length > 0;

    let timeStamp = exists ? filteredIntervals[0].from : null;

    let i = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return exists;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!exists) {
                return '';
            }

            return getFormattedTime(template, timeStamp);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let interval = filteredIntervals[i];

            if (typeof interval === 'undefined') {
                return false;
            }

            if (interval.to - timeStamp - duration < 0) {
                return false;
            }

            if (interval.to - timeStamp - duration === 0) {
                interval = filteredIntervals[++i];

                let issetInterval = typeof interval !== 'undefined';

                timeStamp = issetInterval ? interval.from : timeStamp;

                return issetInterval;
            }

            timeStamp += TRY_LATER_INTERVAL;

            return true;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const MINUTES_IN_HOURS = 60;
const HOURS_IN_DAY = 24;
const DAYS = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const DAYS_BEFORE_CLOSING = 3;
const MAX_ROBBERY_TIME = DAYS_BEFORE_CLOSING * HOURS_IN_DAY * MINUTES_IN_HOURS - 1;

class Time {
    constructor(day, hours, minutes, timeZone) {
        this.timeZone = timeZone;
        this.time = day * HOURS_IN_DAY * MINUTES_IN_HOURS + hours * MINUTES_IN_HOURS + minutes;
    }

    getDay() {
        const day = Math.floor(this.time / (HOURS_IN_DAY * MINUTES_IN_HOURS));
        const keys = Object.keys(DAYS);

        for (let i = 0; i < keys.length; i++) {
            if (Number(DAYS[keys[i]]) === day) {
                return keys[i];
            }
        }
    }

    getHours() {
        const hours = String(Math.floor(this.time % (HOURS_IN_DAY * MINUTES_IN_HOURS) /
        MINUTES_IN_HOURS));

        if (hours.length < 2) {
            return '0' + hours;
        }

        return hours;
    }

    getMinutes() {
        const minutes = String(this.time % MINUTES_IN_HOURS);

        if (minutes.length < 2) {
            return '0' + minutes;
        }

        return minutes;
    }

    changeTimeZone(timeZone) {
        this.time += (timeZone - this.timeZone) * MINUTES_IN_HOURS;
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
    const freeTime = getFreeTime(schedule, workingHours);
    const robberyTime = getRobberiesTime(freeTime, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (robberyTime.length !== 0) {
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
            if (!this.exists()) {
                return '';
            }

            template = template.replace(/%HH/, robberyTime[0].getHours());
            template = template.replace(/%MM/, robberyTime[0].getMinutes());
            template = template.replace(/%DD/, robberyTime[0].getDay());

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robberyTime.length > 1) {
                return true;
            }

            return false;
        }
    };
}

function getRobberiesTime(freeTime, duration) {
    const robberyTime = [];

    freeTime.forEach(element => {
        let fTime = element.to.time - element.from.time;

        while (fTime > duration) {
            robberyTime.push(element.to.time - fTime);
            fTime -= duration + 30;
        }
    });

    return robberyTime;
}

function getFreeTime(schedule, workingHours) {
    const freeTime = [];
    const unsuitableTime = [];
    const keys = Object.keys(DAYS);

    for (let i = 0; i < DAYS_BEFORE_CLOSING; i++) {
        freeTime.push({
            from: convertStringToTime(keys[i] + ' ' + workingHours.from),
            to: convertStringToTime(keys[i] + ' ' + workingHours.to)
        });
    }

    for (let key in schedule) {
        if (!schedule.hasOwnProperty(key)) {
            continue;
        }

        const a = getUnsuitableTime(schedule[key], freeTime[0].from.timeZone);
        for (let i = 0; i < a.length; i++) {
            unsuitableTime.push(a[i]);
        }
    }

    return differenceIntervals(freeTime, unionIntervals(unsuitableTime));
}

function unionIntervals(unsuitableTime) {
    return unsuitableTime
        .sort((a, b) => {
            if (a.from.time === b.from.time) {
                return a.to.time > b.to.time ? 1 : -1;
            }

            return a.from.time > b.from.time ? 1 : -1;
        })
        .filter(element => element.from.time <= MAX_ROBBERY_TIME)
        .map(element => {
            if (element.to.time > MAX_ROBBERY_TIME) {
                element.to.time = MAX_ROBBERY_TIME;
            }

            return element;
        });
}

function differenceIntervals(freeTime, unsuitableTime) {
    const arrayFreeTime = [];

    freeTime.forEach(element => {
        const array = unsuitableTime.reduce((intervals, value) => {
            for (let i = 0; i < intervals.length; i++) {
                const fromIncludedInTheInterval = intervals[i].from.time < value.from.time &&
                intervals[i].to.time > value.from.time;
                const toIncludedInTheInterval = intervals[i].from.time < value.to.time &&
                intervals[i].to.time > value.to.time;
                if (fromIncludedInTheInterval && toIncludedInTheInterval) {
                    intervals.splice(i, 1, {
                        from: intervals[i].from,
                        to: value.from
                    },
                    {
                        from: value.to,
                        to: intervals[i].to
                    });
                } else {
                    intervals[i] = d(fromIncludedInTheInterval, toIncludedInTheInterval,
                        intervals[i], value);
                }
            }

            return intervals;
        }, [element]);

        array.forEach(a => {
            arrayFreeTime.push(a);
        });
    });

    return arrayFreeTime;
}

function d(fromIncludedInTheInterval, toIncludedInTheInterval, intervals, value) {
    if (fromIncludedInTheInterval) {
        intervals.to.time = value.from.time;
    } else if (toIncludedInTheInterval) {
        intervals.from.time = value.to.time;
    }
}

function getUnsuitableTime(intervals, timeZone) {
    const arrayIntervals = [];

    intervals.forEach(element => {
        const busyFrom = convertStringToTime(element.from);
        const busyTo = convertStringToTime(element.to);

        busyFrom.changeTimeZone(timeZone);
        busyTo.changeTimeZone(timeZone);

        arrayIntervals.push({
            from: busyFrom,
            to: busyTo
        });
    });

    return arrayIntervals;
}

function convertStringToTime(stringRepresentationDate) {
    const dayAndTime = stringRepresentationDate.split(' ');
    const timeAndGTM = dayAndTime[1].split('+');
    const hoursAndMinutes = timeAndGTM[0].split(':');

    return new Time(DAYS[dayAndTime[0]], Number(hoursAndMinutes[0]), Number(hoursAndMinutes[1]),
        Number(timeAndGTM[1]));
}

module.exports = {
    getAppropriateMoment,

    isStar
};

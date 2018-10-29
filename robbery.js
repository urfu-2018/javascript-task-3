'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

let bankTimeZone = 0;
let startWorkBank = 0;
let endWorkBank = 0;
let freeTimeIntervalsFrom = [];
let freeTimeIntervalsTo = [];
let rightTimeStart = [];
let rightTimeEnd = [];
let timeNumber = 0;

function splitTime(time) {
    const parsingTime = time.split(/ |:|\+/);
    const day = DAYS.indexOf(parsingTime[0]);
    const timeInMinutes = parsingTime[1] * MINUTES_IN_HOUR +
            Number(parsingTime[2]) + Number(day * MINUTES_IN_DAY) +
            Number(MINUTES_IN_HOUR * (bankTimeZone - parsingTime[3]));

    return timeInMinutes;
}

function bankTimeInMinutes(workingHours) {
    const workingHoursFrom = workingHours.from.split(/:|\+/);
    const workingHoursTo = workingHours.to.split(/:|\+/);

    bankTimeZone = workingHoursFrom[2];
    startWorkBank = workingHoursFrom[0] * MINUTES_IN_HOUR + Number(workingHoursFrom[1]);
    endWorkBank = workingHoursTo[0] * MINUTES_IN_HOUR + Number(workingHoursTo[1]);
}

function sortTime(firstTime, secondTime) {
    return firstTime - secondTime;
}

function checkInterval(duration) {
    for (let i = 0; i < freeTimeIntervalsFrom.length; i++) {
        if (freeTimeIntervalsTo[i] - freeTimeIntervalsFrom[i] >= duration) {
            rightTimeStart.push(freeTimeIntervalsFrom[i]);
            rightTimeEnd.push(freeTimeIntervalsTo[i]);
        }
    }

    rightTimeStart.sort(sortTime);
    rightTimeEnd.sort(sortTime);
}

function confluence(robberyTimeFrom, robberyTimeTo, i) {
    if (robberyTimeTo >= freeTimeIntervalsTo[i] || robberyTimeTo <= freeTimeIntervalsFrom[i]) {
        freeTimeIntervalsFrom[i] = freeTimeIntervalsFrom[i];
    } else if (robberyTimeTo >= freeTimeIntervalsTo[i] && 
        robberyTimeFrom > freeTimeIntervalsFrom[i]) {
        freeTimeIntervalsTo[i] = robberyTimeFrom;
    } else if (robberyTimeTo < freeTimeIntervalsTo[i] && robberyTimeFrom <= freeTimeIntervalsFrom[i]) {
        freeTimeIntervalsFrom[i] = robberyTimeTo;
    } else if (robberyTimeTo < freeTimeIntervalsTo[i] && robberyTimeFrom > freeTimeIntervalsFrom[i]) {
        freeTimeIntervalsTo.push(freeTimeIntervalsTo[i]);
        freeTimeIntervalsFrom.push(robberyTimeTo);
        freeTimeIntervalsTo[i] = robberyTimeFrom;
    } else {
        freeTimeIntervalsFrom[i] = 0;
        freeTimeIntervalsTo[i] = 0;
    }
}

function interval(robberyTimeFrom, robberyTimeTo)    {
    for (let i = 0; i < freeTimeIntervalsFrom.length; i++) {
        confluence(robberyTimeFrom, robberyTimeTo, i);
    }
}

function exclude(schedule) {
    for (let robbery of Object.keys(schedule)) {
        schedule[robbery].forEach(item => {
            const robberyTimeFrom = splitTime(item.from);
            const robberyTimeTo = splitTime(item.to);
            interval(robberyTimeFrom, robberyTimeTo);
        });
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

    freeTimeIntervalsFrom = [];
    freeTimeIntervalsTo = [];
    rightTimeStart = [];
    rightTimeEnd = [];
    timeNumber = 0;

    bankTimeInMinutes(workingHours);

    for (let i = 0; i < 3; i++) {
        freeTimeIntervalsFrom.push(startWorkBank + MINUTES_IN_DAY * i);
        freeTimeIntervalsTo.push(endWorkBank + MINUTES_IN_DAY * i);
    }

    exclude(schedule);
    checkInterval(duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (rightTimeStart.length) {
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

            const time = rightTimeStart[timeNumber];
            const day = 0;

            while (time >= MINUTES_IN_DAY) {
                time -= MINUTES_IN_DAY;
                day++;
            }

            let minutes = time % MINUTES_IN_DAY;
            let hours = (time - minutes) / MINUTES_IN_HOUR;

            minutes = (minutes < 10 ? '0' : '') + minutes;
            hours = (hours < 10 ? '0' : '') + hours;

            return template
                .replace('%HH', hours)
                .replace('%MM', minutes)
                .replace('%DD', DAYS[day]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const time = rightTimeEnd[timeNumber] - rightTimeStart[timeNumber];

            if (time - 30 >= duration) {
                rightTimeStart[timeNumber] += 30;

                return true;
            } else if (rightTimeStart[timeNumber + 1]) {
                timeNumber++

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

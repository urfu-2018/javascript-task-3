'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

/**
 * КОНСТАНТЫ, КОТОРЫЕ БУДУТ ИСПОЛЬЗОВАТЬСЯ ПОЧТИ ВЕЗДЕ
 */
const HOUR_IN_DAY = 24;
const MINUTES_IN_DAY = 1440;
const MINUTES_IN_HOUR = 60;

/**
 *Преобразует часы занятости бандитов
 * в занятые минуты на интервале минут
 * по Гринвичу
 */

function getDayShiftHours(str) {
    let dayShift = 0;
    if (str === 'ВТ') {
        dayShift = HOUR_IN_DAY;
    }
    if (str === 'СР') {
        dayShift = HOUR_IN_DAY * 2;
    }

    return dayShift;
}

function getInterval(period) {
    let interval = {};
    let dayStart = getDayShiftHours(period.from.substring(0, 2));
    let dayFinish = getDayShiftHours(period.to.substring(0, 2));
    let hourStart = MINUTES_IN_HOUR * dayStart +
        MINUTES_IN_HOUR * parseInt(period.from.substring(3, 5), 10);
    let hourFinish = MINUTES_IN_HOUR * dayFinish +
        MINUTES_IN_HOUR * parseInt(period.to.substring(3, 5), 10);
    let minutesStart = parseInt(period.from.substring(6, 8), 10);
    let minutesFinish = parseInt(period.to.substring(6, 8), 10);
    let gmtStart = MINUTES_IN_HOUR * period.from.split('+')[1];
    let gmtFinish = MINUTES_IN_HOUR * period.to.split('+')[1];
    interval.from = hourStart + minutesStart - gmtStart;
    interval.to = hourFinish + minutesFinish - gmtFinish;

    return interval;
}

function convertScheduleToInterval(sheduledTime) {
    let arrayOfIntervals = [];
    for (let period of sheduledTime) {
        let interval = getInterval(period);
        arrayOfIntervals.push(interval);
    }

    return arrayOfIntervals;
}

function convertBankTimeToInterval(bankTime) {
    let fromHour = parseInt(bankTime.from.substring(0, 2), 10);
    let fromMin = parseInt(bankTime.from.substring(3, 5), 10);
    let toHour = parseInt(bankTime.to.substring(0, 2), 10);
    let toMin = parseInt(bankTime.to.substring(3, 5), 10);
    let arrayOfIntervals = [];
    for (let day = 0; day <= HOUR_IN_DAY * 2; day += HOUR_IN_DAY) {
        let interval = {};
        interval.from = MINUTES_IN_HOUR * day + fromHour * MINUTES_IN_HOUR + fromMin;
        interval.to = MINUTES_IN_HOUR * day + toHour * MINUTES_IN_HOUR + toMin;
        arrayOfIntervals.push(interval);
    }

    return arrayOfIntervals;
}

function haveAnyIntersect(arrayOfIntervals, currentInterval) {
    let resultFind = arrayOfIntervals.find(intervalInArray => {

        return isIntersect(currentInterval, intervalInArray);
    }); // find

    return resultFind;
}

function setBankTimezone(bankTime, allTimeOfBusy) {
    let grinvichStart = MINUTES_IN_HOUR * bankTime.from.split('+')[1];
    let grinvichFinish = MINUTES_IN_HOUR * bankTime.to.split('+')[1];
    allTimeOfBusy.forEach(timeOfBusy => { // стрелочная функция и ФорИч
        timeOfBusy.from += grinvichStart;
        timeOfBusy.to += grinvichFinish;
    });

    return allTimeOfBusy;
}


function isIntersect(x, y) { // Отриацние того, что было
    return y.to > x.from && y.from < x.to;
}

function getTimeOfBusy(gangSchedule, workingHours) {
    let timeDanny = (convertScheduleToInterval(gangSchedule.Danny));
    let timeRusty = (convertScheduleToInterval(gangSchedule.Rusty));
    let timeLinus = (convertScheduleToInterval(gangSchedule.Linus));
    let allTimeOfBusy =
        timeDanny.concat(timeRusty.concat(timeLinus)); // Все перевели в массивы минут
    allTimeOfBusy = setBankTimezone(workingHours, allTimeOfBusy); // Сдвинули для час.п.б.

    return allTimeOfBusy;
}

function searchInterval(interval, bankTime, allTimeOfBusy) {
    let arrayOfResults = [];
    let flag = false;
    while (interval.to <= bankTime.to) {
        if (!haveAnyIntersect(allTimeOfBusy, interval)) {
            flag = true;
            break;
        }
        interval.to += 1;
        interval.from += 1;
    }
    arrayOfResults.push(flag, interval);

    return arrayOfResults;
}

function formatCatchedPeriod(period) {
    let start = period.from;
    let day = Math.floor(start / MINUTES_IN_DAY);
    let hour = Math.floor((start - day * MINUTES_IN_DAY) / MINUTES_IN_HOUR);
    let min = ((start - day * MINUTES_IN_DAY) % MINUTES_IN_HOUR);
    let res = [];
    res.push(getDay(day), numInStr(hour), numInStr(min));

    return res;
}

function getDay(dayShift) {
    return ['ПН', 'ВТ', 'СР'][dayShift]; // doMagic
}

function numInStr(num) {
    let str;
    if (num < 10) {
        str = '0' + String(num);
    } else {
        str = String(num);
    }

    return str;
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
    let allTimeOfBusy = getTimeOfBusy(schedule, workingHours);
    let arrayBankTime = convertBankTimeToInterval(workingHours);
    let flag = false;
    let resultInterval = [];
    for (let i = 0; i < arrayBankTime.length; i++) {
        let interval = { from: arrayBankTime[i].from, to: arrayBankTime[i].from + duration };
        let resultOfSearch = searchInterval(interval, arrayBankTime[i], allTimeOfBusy);
        flag = resultOfSearch[0];
        if (flag) {
            resultInterval = formatCatchedPeriod(resultOfSearch[1]);
            break; //
        }
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return flag;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let formatedResult;
            if (resultInterval.length === 0) {
                formatedResult = '';
            } else {
                formatedResult = template.replace('%DD', resultInterval[0])
                    .replace('%HH', resultInterval[1])
                    .replace('%MM', resultInterval[2]);
            }

            return formatedResult;
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

module.exports = {
    getAppropriateMoment,

    isStar
};

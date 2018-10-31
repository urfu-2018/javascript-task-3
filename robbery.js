'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

/**
 *Преобразует часы занятости бандитов
 * в занятые минуты на интервале минут
 * по Гринвичу
 */

function setDay(str) {
    let dayShift = 0;
    if (str === 'ВТ') {
        dayShift = 24;
    }
    if (str === 'СР') {
        dayShift = 48;
    }

    return dayShift;
}

function formatScheduleToInterval(NameInSchedule) {
    let arrayOfIntervals = [];
    for (let period of NameInSchedule) {
        let dayStart = setDay(period.from.substring(0, 2));
        let dayFinish = setDay(period.to.substring(0, 2));
        let hourStart = 60 * dayStart + 60 * parseInt(period.from.substring(3, 5));
        let hourFinish = 60 * dayFinish + 60 * parseInt(period.to.substring(3, 5));
        let minutStart = parseInt(period.from.substring(6, 8));
        let minutFinish = parseInt(period.to.substring(6, 8));
        let grinvichStart = 60 * period.from.split('+')[1];
        let grinvichFinish = 60 * period.to.split('+')[1];
        let interval = {};
        interval.from = hourStart + minutStart - grinvichStart;
        interval.to = hourFinish + minutFinish - grinvichFinish;
        arrayOfIntervals.push(interval);
    }

    return arrayOfIntervals;
}

function formatBankTimeToInterval(bankTime) {
    let fromHour = parseInt(bankTime.from.substring(0, 2));
    let fromMin = parseInt(bankTime.from.substring(3, 5));
    let toHour = parseInt(bankTime.to.substring(0, 2));
    let toMin = parseInt(bankTime.to.substring(3, 5));
    let arrayOfIntervals = [];
    for (let day = 0; day <= 48; day += 24) {
        let interval = {};
        interval.from = 60 * day + fromHour * 60 + fromMin;
        interval.to = 60 * day + toHour * 60 + toMin;
        arrayOfIntervals.push(interval);
    }

    return arrayOfIntervals;
}

function haveAnyIntersect(arrayOfIntervals, currentInterval) {
    let flag = false;
    for (let i in arrayOfIntervals) {
        if (!notIntersect(currentInterval, arrayOfIntervals[i])) {
            flag = true;
            break;
        }
    }

    return flag;
}

function setBankTimezone(bankTime, allTimeOfBusy) {
    let grinvichStart = 60 * bankTime.from.split('+')[1];
    let grinvichFinish = 60 * bankTime.to.split('+')[1];
    for (let i = 0; i < allTimeOfBusy.length; i++) {
        allTimeOfBusy[i].from += grinvichStart;
        allTimeOfBusy[i].to += grinvichFinish;
    }

    return allTimeOfBusy;
}


function notIntersect(x, y) {
    return y.to <= x.from || y.from >= x.to;
}

function getTimeOfBusy(gangSchedule, workingHours) {
    let timeDanny = (formatScheduleToInterval(gangSchedule.Danny));
    let timeRusty = (formatScheduleToInterval(gangSchedule.Rusty));
    let timeLinus = (formatScheduleToInterval(gangSchedule.Linus));
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
    let day = Math.floor(start / 1440);
    let hour = Math.floor((start - day * 1440) / 60);
    let min = ((start - day * 1440) % 60);
    let res = [];
    res.push(getDay(day), numInStr(hour), numInStr(min));

    return res;
}

function getDay(dayShift) {
    let strDay;
    if (dayShift === 0) {
        strDay = 'ПН';
    }
    if (dayShift === 1) {
        strDay = 'ВТ';
    }
    if (dayShift === 2) {
        strDay = 'СР';
    }

    return strDay;
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
    let arrayBankTime = formatBankTimeToInterval(workingHours);
    let flag = false;
    let resultInterval = [];
    for (let i = 0; i < arrayBankTime.length && flag === false; i++) {
        let interval = { from: arrayBankTime[i].from, to: arrayBankTime[i].from + duration };
        let resultOfSearch = searchInterval(interval, arrayBankTime[i], allTimeOfBusy);
        flag = resultOfSearch[0];
        if (flag) {
            resultInterval = formatCatchedPeriod(resultOfSearch[1]);
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

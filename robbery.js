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
// const gangSchedule = {
//     Danny: [
//         { from: 'ПН 12:00+10', to: 'ПН 17:00+5' },
//         { from: 'ВТ 13:00+5', to: 'ВТ 16:00+5' }
//     ],
//     Rusty: [
//         { from: 'ПН 11:30+5', to: 'ПН 16:30+5' },
//         { from: 'ВТ 13:00+5', to: 'ВТ 16:00+5' }
//     ],
//     Linus: [
//         { from: 'ПН 09:00+3', to: 'ПН 14:00+3' },
//         { from: 'ПН 21:00+3', to: 'ВТ 09:30+3' },
//         { from: 'СР 09:30+3', to: 'СР 15:00+3' }
//     ]
// };

function setDay(str) {
    let day = 0;
    if (str === 'ВТ') {
        day = 24;
    }
    if (str === 'СР') {
        day = 48;
    }

    return day;
}

function convertIntoInterval(Name) {
    let arrayOfIntervals = [];
    for (let period of Name) {
        let dayStart = setDay(period.from.substring(0, 2));
        let hourStart = 60 * dayStart + 60 * parseInt(period.from.substring(3, 5));
        let mintStart = parseInt(period.from.substring(6, 8));
        let grinvichStart = 60 * period.from.split('+')[1];
        let dayFinish = setDay(period.to.substring(0, 2));
        let hourFinish = 60 * dayFinish + 60 * parseInt(period.to.substring(3, 5));
        let mintFinish = parseInt(period.to.substring(6, 8));
        let grinvichFinish = 60 * period.to.split('+')[1];
        let interval = {};
        interval.from = hourStart + mintStart - grinvichStart;
        interval.to = hourFinish + mintFinish - grinvichFinish;
        arrayOfIntervals.push(interval);
    }

    return arrayOfIntervals;
}

// const bankTime1 = { from: '10:13+5', to: '18:00+5' };

// console.log(allTimeOfBusy);

function convertBankTime(bankTime) {
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

function haveAnyIntersect(arrayOfIntervals, interval) {
    let flag = false;
    for (let i in arrayOfIntervals) {
        if (!notIntersect(interval, arrayOfIntervals[i])) {
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

// (getAppropriateMoment(gangSchedule, 90, bankTime1).exists());

function getTimeOfBusy(gangSchedule, workingHours) {
    let timeDanny = (convertIntoInterval(gangSchedule.Danny));
    let timeRusty = (convertIntoInterval(gangSchedule.Rusty));
    let timeLinus = (convertIntoInterval(gangSchedule.Linus));
    let allTimeOfBusy =
        timeDanny.concat(timeRusty.concat(timeLinus)); // Все перевели в массивы минут
    allTimeOfBusy = setBankTimezone(workingHours, allTimeOfBusy); // Сдвинули для час.п.б.

    return allTimeOfBusy;
}

function searchInterval(interval, bankTime, allTimeOfBusy) {
    let arrayOfReturn = [];
    let flag = false;
    while (interval.to <= bankTime.to) {
        if (!haveAnyIntersect(allTimeOfBusy, interval)) {
            // console.log(formatCatchedPeriod(interval));
            flag = true;
            break;
        }
        interval.to += 1;
        interval.from += 1;
    }
    arrayOfReturn.push(flag, interval);

    return arrayOfReturn;
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

function getDay(day) {
    let strDay;
    if (day === 0) {
        strDay = 'ПН';
    }
    if (day === 1) {
        strDay = 'ВТ';
    }
    if (day === 2) {
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
    // console.info(allTimeOfBusy, 'ALL TIME OF BUSY');
    // console.info(duration, 'TIME FOR WORK');
    let arrayBankTime = convertBankTime(workingHours);
    // console.info(arrayBankTime, 'BANK TIME');
    let flag = false;
    let result = [];
    for (let i = 0; i < arrayBankTime.length && flag === false; i++) {
        let interval = { from: arrayBankTime[i].from, to: arrayBankTime[i].from + duration };
        let arrayOfReturn = searchInterval(interval, arrayBankTime[i], allTimeOfBusy);
        flag = arrayOfReturn[0];
        if (flag) {
            result = formatCatchedPeriod(arrayOfReturn[1]);
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
            let returnedResult;
            if (result.length === 0) {
                returnedResult = '';
            } else {
                returnedResult = template.replace('%DD', result[0])
                    .replace('%HH', result[1])
                    .replace('%MM', result[2]);
            }

            return returnedResult;
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

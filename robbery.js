'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
const minInHour = 60;
const hoursInDay = 24;
const minInDay = 1440;
const DAYS = new Map([['ПН', 0], ['ВТ', 1440], ['СР', 2880]]);
const daysNumber = ['ПН', 'ВТ', 'СР'];
const breakStr = /:|\+|\s/;
var resultTime = {};
var possibleLaterTime = [];
var Nexttimepointer;
var dur;

function checkIsWorking(bankTimeDay, i) {
    return (i < bankTimeDay[0] || i > bankTimeDay[1]) ||
    (i + dur < bankTimeDay[0] || i + dur > bankTimeDay[1]);
}

function checkIsBusy(somebodyBusy, i, j) {
    return (i > somebodyBusy[j][0] && i < somebodyBusy[j][1]) ||
    (i + dur > somebodyBusy[j][0] && i + dur < somebodyBusy[j][1]);
}

function timeCheck(i, somebodyBusy, bankTimeDay) {
    for (let j = 0; j < somebodyBusy.length; j++) {
        if (checkIsBusy(somebodyBusy, i, j) || checkIsWorking(bankTimeDay, i)) {
            return false;
        }
    }

    return true;
}

function getBankTimeDay(i) {

    i[0] = Number(i[0]);
    i[1] = Number(i[1]);

    return i;
}

function minutesToObject(i) {
    resultTime.day = daysNumber[Math.floor(i / (hoursInDay * minInHour))];
    resultTime.hour = Math.floor((i - Math.floor(i /
         (hoursInDay * minInHour)) * minInDay) / minInHour);
    resultTime.minute = (i - Math.floor(i / (hoursInDay * minInHour)) * minInDay) % minInHour;
}

function addDayToBankTime(bankTimeDay, i) {
    if (i === minInDay || i === 2 * minInDay) {
        bankTimeDay[0] += minInDay;
        bankTimeDay[1] += minInDay;
    }

    return bankTimeDay;
}

function possibleTime(bankTimeSplit, somebodyBusy, duration) {
    dur = duration;
    possibleLaterTime = [];
    resultTime = {};

    let bankTimeDay = getBankTimeDay(bankTimeSplit.slice());

    for (let i = 0; i < 4320; i++) {
        addDayToBankTime(bankTimeDay, i);
        let check = timeCheck(i, somebodyBusy, bankTimeDay);
        if (check && possibleLaterTime.length === 0) {
            possibleLaterTime.push(i);
            Nexttimepointer = 0;
            minutesToObject(i);
        } else if (check && i >= possibleLaterTime[possibleLaterTime.length - 1] + 30) {
            possibleLaterTime.push(i);
        }
    }

    return possibleLaterTime.length !== 0;
}
function initiazileBankTimeSplit(workingHours) {
    let bankTimeSplit = [];
    bankTimeSplit.push(workingHours.from.split(breakStr));
    bankTimeSplit.push(workingHours.to.split(breakStr));

    return bankTimeSplit;
}

function initiazileSomebodyBusy(band, bankTimeSplit, schedule) {
    let somebodyBusy = [];
    for (let i = 0; i < band.length; i++) {
        for (let j = 0; j < (Object.keys(schedule[band[i]])).length; j++) {
            somebodyBusy.push([]);
            let fromArgs = schedule[band[i]][j].from.split(breakStr);
            let toArgs = schedule[band[i]][j].to.split(breakStr);
            let timeDiffer = Number(bankTimeSplit[0][2]) - Number(fromArgs[3]);
            somebodyBusy[somebodyBusy.length - 1].push(Number(DAYS.get(fromArgs[0])) +
            Number(fromArgs[1] * minInHour) + Number(fromArgs[2]) + Number(timeDiffer) * minInHour);
            somebodyBusy[somebodyBusy.length - 1].push(Number(DAYS.get(toArgs[0])) +
            Number(toArgs[1] * minInHour) + Number(toArgs[2]) + Number(timeDiffer) * minInHour);
        }
    }

    return somebodyBusy;
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
    const band = Object.keys(schedule);
    const bankTimeSplit = initiazileBankTimeSplit(workingHours);
    const somebodyBusy = initiazileSomebodyBusy(band, bankTimeSplit, schedule);
    bankTimeSplit[0] = Number(bankTimeSplit[0][0]) * minInHour + Number(bankTimeSplit[0][1]);
    bankTimeSplit[1] = Number(bankTimeSplit[1][0]) * minInHour + Number(bankTimeSplit[1][1]);

    console.info(schedule, duration, workingHours);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return possibleTime(bankTimeSplit, somebodyBusy, duration);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (possibleLaterTime.length === 0) {
                return '';
            }
            if (String(resultTime.minute).length !== 2) {
                resultTime.minute = `0${resultTime.minute}`;
            }
            template = template.replace('%DD', resultTime.day)
                .replace('%HH', resultTime.hour)
                .replace('%MM', resultTime.minute);

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (possibleLaterTime.length === 0) {
                return false;
            }
            Nexttimepointer++;
            if (Nexttimepointer >= possibleLaterTime.length) {
                return false;
            }
            minutesToObject(Math.floor(possibleLaterTime[Nexttimepointer]));

            return true;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const DAYS_KEYS= { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const NUMBER_KEYS = { 0: 'ПН', 1: 'ВТ', 2: 'СР', 3: 'ЧТ', 4: 'ПТ', 5: 'СБ', 6: 'ВС' };

function getDeltaTime(str) {
    return parseInt(str.match(/[+]\d+/).toString().substr(1));
}

function getHoursFromStr(str) {
    let hour = str.match(/\d+:/).toString();
    return parseInt(hour.substring(0,hour.length-1));
}

function getDayFromStr(str) {
    return str.match(/[А-Я]{2}/).toString();
}

function getMinutesFromStr(str) {
    let minute = str.match(/:\d+/).toString();
    return parseInt(minute.substr(1));
}

function casePlusDeltaTime(time, day, delta) {
    if (time + delta >= 24) {
        time = time + delta - 24;
        let temp = DAYS_KEYS[day];
        temp = (temp == 6) ? 0 : temp++;
        day = NUMBER_KEYS[temp];
    } else {
        time = time + delta;
    }
    return day + " " + time;
}

function caseMinusDeltaTime(time, day, delta) {
    if (time - delta < 0) {
        let kek = delta - time;
        time = 24 - kek;
        let temp = DAYS_KEYS[day];
        temp = (temp == 0) ? 6 : temp--;
        day = NUMBER_KEYS[temp];
    } else {
        time = time - delta;
    }
    return day + " " + time;
}

function convertTimeZone(manSchedule, bankTimeDelta) {
    const deltaMan = getDeltaTime(manSchedule[0].from);
    if (deltaMan == bankTimeDelta) {
        return manSchedule;
    }
    if (deltaMan < bankTimeDelta) {
        let delta = bankTimeDelta - deltaMan;
        for (let i = 0; i < manSchedule.length; i++) {
            let fromStr = manSchedule[i].from;
            let toStr = manSchedule[i].to;
            let fromTime = getHoursFromStr(fromStr);
            let toTime = getHoursFromStr(toStr);
            let fromDay = getDayFromStr(fromStr);
            let toDay = getDayFromStr(toStr);
            let fromMinutes = getMinutesFromStr(fromStr);
            let toMinutes = getMinutesFromStr(toStr);
            manSchedule[i].from = casePlusDeltaTime(fromTime, fromDay, delta) + ':' + fromMinutes + '+' + bankTimeDelta;
            manSchedule[i].to = casePlusDeltaTime(toTime, toDay, delta) + ':' + toMinutes + '+' + bankTimeDelta;
        }
        return manSchedule;
    }
    if (deltaMan > bankTimeDelta) {
        let delta = deltaMan - bankTimeDelta;
        for (let i = 0; i < manSchedule.length; i++) {
            let fromStr = manSchedule[i].from;
            let toStr = manSchedule[i].to;
            let fromTime = getHoursFromStr(fromStr);
            let toTime = getHoursFromStr(toStr);
            let fromDay = getDayFromStr(fromStr);
            let toDay = getDayFromStr(toStr);
            let fromMinutes = getMinutesFromStr(fromStr);
            let toMinutes = getMinutesFromStr(toStr);
            manSchedule[i].from = caseMinusDeltaTime(fromTime, fromDay, delta) + ':' + fromMinutes + '+' + bankTimeDelta;
            manSchedule[i].to = caseMinusDeltaTime(toTime, toDay, delta) + ':' + toMinutes + '+' + bankTimeDelta;
        }
        return manSchedule;
    }
}

function findRoberyTime(schedule, duration, workingHours) {
    const bankTimeDelta = getDeltaTime(workingHours.from);
    console.info(convertTimeZone(schedule.Linus, bankTimeDelta));
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
    //console.info(schedule, duration, workingHours);
    findRoberyTime(schedule, duration, workingHours);
    return {
        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return template;
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

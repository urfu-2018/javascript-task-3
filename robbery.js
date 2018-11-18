'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
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
    let deltaMan = getDeltaTime(manSchedule[0].from);
    if (deltaMan == bankTimeDelta) {
        for (let i = 0; i < manSchedule.length; i++) {
            let fromStr = manSchedule[i].from;
            let toStr = manSchedule[i].to;
            manSchedule[i].from = getDayFromStr(fromStr) + ' ' + getHoursFromStr(fromStr) + ':' + getMinutesFromStr(fromStr) + '+' + bankTimeDelta;
            manSchedule[i].to = getDayFromStr(toStr) + ' ' + getHoursFromStr(toStr) + ':' + getMinutesFromStr(toStr) + '+' + bankTimeDelta;
        }
        return manSchedule;
    }
    if (deltaMan < bankTimeDelta) {
        let delta = bankTimeDelta - deltaMan;
        for (let i = 0; i < manSchedule.length; i++) {
            let fromStr = manSchedule[i].from;
            let toStr = manSchedule[i].to;
            manSchedule[i].from = casePlusDeltaTime(getHoursFromStr(fromStr), getDayFromStr(fromStr), delta) + ':' + getMinutesFromStr(fromStr) + '+' + bankTimeDelta;
            manSchedule[i].to = casePlusDeltaTime(getHoursFromStr(toStr), getDayFromStr(toStr), delta) + ':' + getMinutesFromStr(toStr) + '+' + bankTimeDelta;
        }
        return manSchedule;
    }
    if (deltaMan > bankTimeDelta) {
        let delta = deltaMan - bankTimeDelta;
        for (let i = 0; i < manSchedule.length; i++) {
            let fromStr = manSchedule[i].from;
            let toStr = manSchedule[i].to;
            manSchedule[i].from = caseMinusDeltaTime(getHoursFromStr(fromStr), getDayFromStr(fromStr), delta) + ':' + getMinutesFromStr(fromStr) + '+' + bankTimeDelta;
            manSchedule[i].to = caseMinusDeltaTime(getHoursFromStr(toStr), getDayFromStr(toStr), delta) + ':' + getMinutesFromStr(toStr) + '+' + bankTimeDelta;
        }
        return manSchedule;
    }
}

function convertOccupiedSchedule(scheduleMan) {
    for (let i = 0; i < scheduleMan.length; i++) {
        let fromStr = scheduleMan[i].from;
        let toStr = scheduleMan[i].to;
        let fromDay = getDayFromStr(fromStr);
        let toDay = getDayFromStr(toStr);
        let fromHour = getHoursFromStr(fromStr);
        let toHour = getHoursFromStr(toStr);
        let fromMinutes = getMinutesFromStr(fromStr);
        let toMinutes = getMinutesFromStr(toStr);
        let fromTime = fromHour*60 + fromMinutes;
        let toTime = toHour*60 + toMinutes;
        scheduleMan[i].from = fromDay + ' ' + fromTime;
        scheduleMan[i].to = toDay + ' ' + toTime;
    }
    return scheduleMan;
}

function fillTheDayArray(man, dayArr, dayStr) {
    for (let property of man) {
        let from = property.from;
        let to = property.to;
        if (getDayFromStr(from) === dayStr) {
            if (getDayFromStr(to) === dayStr) {
                let start = from.substring(3, from.length);
                let end = to.substring(3, to.length);
                for (let i = start; i <= end; i++) {
                    dayArr[i]--;
                }
            } else {
                let start = from.substring(3, from.length);
                for (let i = start; i <= 1440; i++) {
                    dayArr[i]--;
                }
            }
        }
    }
}

function findTimeEnd(dayArray, dayStr, duration) {
    for (let i = 0; i < dayArray.length; i++) {
        let flag = true;
        if (dayArray[i] === 4 && dayArray[i + duration] === 4) {
            return i + ' ' + dayStr;
        }
    }
    return 'kek';
}

function findRoberyTime(schedule, duration, workingHours) {
    const bankTimeDelta = getDeltaTime(workingHours.from);
    var kek =  JSON.stringify(schedule);
    kek = JSON.parse(kek);
    kek.Danny = convertTimeZone(kek.Danny, bankTimeDelta);
    kek.Rusty = convertTimeZone(kek.Rusty, bankTimeDelta);
    kek.Linus = convertTimeZone(kek.Linus, bankTimeDelta);
    kek.Danny = convertOccupiedSchedule(kek.Danny);
    kek.Rusty = convertOccupiedSchedule(kek.Rusty);
    kek.Linus = convertOccupiedSchedule(kek.Linus);
    let monday = [];
    let tuesday = [];
    let wednesday = [];
    for (let i = 0; i < 1440; i++) {
        monday.push(3);
    }
    for (let i = 0; i < 1440; i++) {
        tuesday.push(3);
    }
    for (let i = 0; i < 1440; i++) {
        wednesday.push(3)
    }
    fillTheDayArray(kek.Danny, monday, 'ПН');
    fillTheDayArray(kek.Rusty, monday, 'ПН');
    fillTheDayArray(kek.Linus, monday, 'ПН');
    fillTheDayArray(kek.Danny, tuesday, 'ВТ');
    fillTheDayArray(kek.Rusty, tuesday, 'ВТ');
    fillTheDayArray(kek.Linus, tuesday, 'ВТ');
    fillTheDayArray(kek.Danny, wednesday, 'СР');
    fillTheDayArray(kek.Rusty, wednesday, 'СР');
    fillTheDayArray(kek.Linus, wednesday, 'СР');
    
    let fromStr = workingHours.from;
    let toStr = workingHours.to;
    let fromHour = getHoursFromStr(fromStr);
    let toHour = getHoursFromStr(toStr);
    let fromMinutes = getMinutesFromStr(fromStr);
    let toMinutes = getMinutesFromStr(toStr);
    let startTime = fromHour*60 + fromMinutes;
    let endTime = toHour*60 + toMinutes;

    for (let i = startTime; i <= endTime; i++) {
        monday[i]++;
    }
    for (let i = startTime; i <= endTime; i++) {
        tuesday[i]++;
    }
    for (let i = startTime; i <= endTime; i++) {
        wednesday[i]++;
    }
    let answer = findTimeEnd(monday, 'ПН', duration);
    if (answer === 'kek') {
        answer = findTimeEnd(tuesday, 'ВТ', duration);
    }
    if (answer === 'kek') {
        answer = findTimeEnd(wednesday, 'СР', duration);
    }
    console.info(answer);
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

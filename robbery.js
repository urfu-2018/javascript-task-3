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

function fillTheDay(day, from, to, start, end, obj) {
    if (getDayFromStr(from) === day) {
        let num = parseInt(from.substring(3,from.length));
        if (num > start && num < end) {
            obj.first = start;
            obj.firstDelta = num - start;
        }
        if (getDayFromStr(to) === day) {
            let num = parseInt(to.substring(3,to.length));
            if (num > start && num < end) {
                obj.second = num;
                obj.secondDelta = end - num;
            }
        }
    }
    
    return obj;
}

function fiilTheManProperties(man, array, start, end) {
    for (let i = 0; i<array.length; i++) {
        man.monday = fillTheDay('ПН', array[i].from, array[i].to, start, end, man.monday);
        man.tuesday = fillTheDay('ВТ', array[i].from, array[i].to, start, end, man.tuesday);
        man.wednesday = fillTheDay('СР', array[i].from, array[i].to, start, end, man.wednesday);
    }
    return man;
}

function filMiniMap(d, miniMap, day) {
    if (d.firstDelta < miniMap[day].firstDelta) {
        miniMap[day].firstDelta = d.firstDelta;
        miniMap[day].first = d.first;
    }
    if (d.secondDelta < miniMap[day].secondDelta) {
        miniMap[day].secondDelta = d.secondDelta;
        miniMap[day].second = d.second;
    }
    return miniMap;
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
    let delta = {
        from: getHoursFromStr(workingHours.from)*60 + getMinutesFromStr(workingHours.from),
        to: getHoursFromStr(workingHours.to)*60 + getMinutesFromStr(workingHours.to)
    };
    let start = parseInt(delta.from);
    let end = parseInt(delta.to);
    let dannyMap = {
        monday:{},
        tuesday:{},
        wednesday:{}
    };
    dannyMap = fiilTheManProperties(dannyMap, kek.Danny, start, end);
    let rustyMap = {
        monday:{},
        tuesday:{},
        wednesday:{}
    };
    rustyMap = fiilTheManProperties(rustyMap, kek.Rusty, start, end);
    let linusMap = {
        monday:{},
        tuesday:{},
        wednesday:{}
    };
    linusMap = fiilTheManProperties(dannyMap, kek.Linus, start, end);
    let miniMap = {
        monday:{
            first: 1440,
            second: 1440,
            firstDelta: 1440,
            secondDelta: 1440
        },
        tuesday:{
            first: 1440,
            second: 1440,
            firstDelta: 1440,
            secondDelta: 1440
        },
        wednesday:{
            first: 1440,
            second: 1440,
            firstDelta: 1440,
            secondDelta: 1440
        }
    };
    miniMap = filMiniMap(dannyMap.monday, miniMap, 'monday');
    miniMap = filMiniMap(dannyMap.tuesday, miniMap, 'tuesday');
    miniMap = filMiniMap(dannyMap.wednesday, miniMap, 'wednesday');
    miniMap = filMiniMap(rustyMap.monday, miniMap, 'monday');
    miniMap = filMiniMap(rustyMap.tuesday, miniMap, 'tuesday');
    miniMap = filMiniMap(rustyMap.wednesday, miniMap, 'wednesday');
    miniMap = filMiniMap(linusMap.monday, miniMap, 'monday');
    miniMap = filMiniMap(linusMap.tuesday, miniMap, 'tuesday');
    miniMap = filMiniMap(linusMap.wednesday, miniMap, 'wednesday');
    let time = -1;
    let day = 's';
    if (miniMap.monday.firstDelta >= duration) {
        time = miniMap.monday.first;
        day = 'ПН';
    }
    if (miniMap.monday.secondDelta >= duration) {
        time = miniMap.monday.second;
        day = 'ПН';
    }
    if (miniMap.tuesday.firstDelta >= duration) {
        time = miniMap.tuesday.first;
        day = 'ВТ';
    }
    if (miniMap.tuesday.secondDelta >= duration) {
        time = miniMap.tuesday.second;
        day = 'ВТ';
    }
    if (miniMap.wednesday.firstDelta >= duration) {
        time = miniMap.wednesday.first;
        day = 'СР';
    }
    if (miniMap.wednesday.secondDelta >= duration) {
        time = miniMap.wednesday.second;
        day = 'СР';
    }
    console.info(day + " " + time);
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

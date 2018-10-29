'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const weekdays = ['ПН', 'ВТ', 'СР'];
let i = 0;
let scheduleFull = [];
let bankTimeZone, startIndex;
let checkBank = false, checkDanny = true, checkRusty = true, checkLinus = true;

function createItemSchedule(minutes, name, status) {
    return { minutes, name, status };
}

function createMinutesOfDay(hour, minute, timezone, weekday = 0) {
    return weekdays.indexOf(weekday) * 24 * 60 + (parseInt(hour) - parseInt(timezone)) * 60 + parseInt(minute);
}

function createSchedulesCompanions(schedule) {
    const keys = Object.keys(schedule);
    let scheduleItem;
    keys.forEach(name => {
        schedule[name].forEach(participant => {
            scheduleItem = participant.from.split(/\ |:|\+/);
            scheduleFull[i] = createItemSchedule(
                createMinutesOfDay(scheduleItem[1], scheduleItem[2], scheduleItem[3], scheduleItem[0]),
                name, 'from');
            i++;
            scheduleItem = participant.to.split(/\ |:|\+/);
            scheduleFull[i] = createItemSchedule(
                createMinutesOfDay(scheduleItem[1], scheduleItem[2], scheduleItem[3], scheduleItem[0]),
                name, 'to');
            i++;
        });
    });
}

function createSchedulesBank(workingHours) {
    let scheduleItemFrom;
    let scheduleItemTo;
    scheduleItemFrom = workingHours.from.split(/\ |:|\+/);
    scheduleItemTo = workingHours.to.split(/\ |:|\+/);
    bankTimeZone = scheduleItemFrom[2];
    weekdays.forEach(weekday => {
        scheduleFull[i] = createItemSchedule(
            createMinutesOfDay(scheduleItemFrom[0], scheduleItemFrom[1], scheduleItemFrom[2], weekday),
            'Bank', 'from');
        i++;
        scheduleFull[i] = createItemSchedule(
            createMinutesOfDay(scheduleItemTo[0], scheduleItemTo[1], scheduleItemTo[2], weekday),
            'Bank', 'to');
        i++;
    });
}

function compare(a, b) {
    return a.minutes - b.minutes;
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
    startIndex = 0;
    if (scheduleFull.length === 0) {
        createSchedulesCompanions(schedule);
        createSchedulesBank(workingHours);
        scheduleFull.sort(compare);
    }
    let templateMinute = findFreeSchedule(scheduleFull, duration);
    return {
        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (templateMinute !== 0) {
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
            if (templateMinute !== 0) {
                const weekdayIndex = Math.floor(templateMinute / (24 * 60));
                const weekday = weekdays[weekdayIndex];
                const hour = (Math.floor((templateMinute - 24 * 60 * weekdayIndex) / 60)).toString();
                let paddedHour = hour.length === 1 ? '0' + hour : hour;
                const minute = (templateMinute % 60).toString();
                let paddedMinute = minute.length === 1 ? '0' + minute : minute;
                const replacementDict = { '%HH': paddedHour, '%DD': weekday, '%MM': paddedMinute };
                return template.replace(/%HH|%MM|%DD/gi, m => replacementDict[m]);
            }
            return '""';
        },
        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            templateMinute = findFreeSchedule(scheduleFull, duration, templateMinute);
            if (templateMinute !== 0) {
                return true;
            }
            return false;
        }
    };
}

function findFreeSchedule(scheduleFull, duration, lastTime = 0) {
    let actualMinutes = 0;
    //let checkExit = false;
    for (let i = startIndex; i < scheduleFull.length; i++) {
        let scheduleItem = scheduleFull[i];
        //if (!checkExit) {
        if (scheduleItem.status === 'from') {
            switch (scheduleItem.name) {
                case 'Bank':
                    checkBank = true;
                    break;
                case 'Danny':
                    checkDanny = false;
                    // if (actualMinutes > scheduleItem.minutes) {
                    //     actualMinutes = 0;
                    // }
                    // else if (actualMinutes !== 0) {
                    //     checkExit = true;
                    // }
                    break;
                case 'Rusty':
                    checkRusty = false;
                    // if (actualMinutes > scheduleItem.minutes) {
                    //     actualMinutes = 0;
                    // }
                    // else if (actualMinutes !== 0) {
                    //     checkExit = true;
                    // }
                    break;
                case 'Linus':
                    checkLinus = false;
                    // if (actualMinutes > scheduleItem.minutes) {
                    //     actualMinutes = 0;
                    // }
                    // else if (actualMinutes !== 0) {
                    //     checkExit = true;
                    // }
                    break;
            }
        }
        else if (scheduleItem.status === 'to') {
            switch (scheduleItem.name) {
                case 'Bank':
                    checkBank = false;
                    // if (actualMinutes > scheduleItem.minutes) {
                    //     actualMinutes = 0;
                    // }
                    // else if (actualMinutes !== 0) {
                    //     checkExit = true;
                    // }
                    break;
                case 'Danny':
                    checkDanny = true;
                    break;
                case 'Rusty':
                    checkRusty = true;
                    break;
                case 'Linus':
                    checkLinus = true;
                    break;
            }
        }
        //}
        if (checkBank && checkDanny && checkRusty && checkLinus) {
            actualMinutes = scheduleItem.minutes + duration;
            if (actualMinutes <= scheduleFull[i + 1].minutes) {
                if (lastTime === 0) {
                    startIndex = i;

                    return actualMinutes - duration + bankTimeZone * 60;
                }
                else if ((lastTime + 30 + duration - bankTimeZone * 60) <= scheduleFull[i + 1].minutes &&
                    (actualMinutes - duration + bankTimeZone * 60) >= lastTime) {
                    startIndex = i;
                    if((actualMinutes - duration + bankTimeZone * 60)!==lastTime){
                        return actualMinutes - duration + bankTimeZone * 60;
                    }

                    return actualMinutes + 30 - duration + bankTimeZone * 60;
                }
            }
        }
    }

    return 0;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

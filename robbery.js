'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const timeRE = new RegExp('^(.{2})\\s(\\d{2}):(\\d{2})\\+(\\d)$');
const dayNames = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

const minutesInDay = 1440;
const minutesInHour = 60;
const open = 0;
const close = 1;
let timeBeforeStart;
let timeAfterEnd;

function getMinutesFromWeekStart(timeString) {
    const parsed = timeRE.exec(timeString);
    const days = dayNames.indexOf(parsed[1]);
    const hours = parseInt(parsed[2]) - parseInt(parsed[4]);
    const minutes = parseInt(parsed[3]);

    return days * minutesInDay + hours * minutesInHour + minutes;
}

function getEvents(schedule) {
    return schedule.reduce((events, timePeriod) => {
        events.push({ time: getMinutesFromWeekStart(timePeriod.from), type: open });
        events.push({ time: getMinutesFromWeekStart(timePeriod.to), type: close });

        return events;
    }, []);
}

function getEventsFromRobberSchedule(robberSchedule) {
    let result = robberSchedule.reduce((events, timePeriod) => {
        events.push({ time: getMinutesFromWeekStart(timePeriod.from), type: close });
        events.push({ time: getMinutesFromWeekStart(timePeriod.to), type: open });

        return events;
    }, [{ time: timeBeforeStart, type: open }]);
    result.push({ time: timeAfterEnd, type: close });

    return result;
}

function getEventsFromBankWorkingHours(bankWorkingHours) {
    let bankWorkingHoursByDays = dayNames.slice(0, 3)
        .map(day => {
            return {
                from: day + ' ' + bankWorkingHours.from,
                to: day + ' ' + bankWorkingHours.to
            };
        });

    return getEvents(bankWorkingHoursByDays);
}

// Use ScanLine algorithm
// Don't really know how to simplify it, so just disable warning
// eslint-disable-next-line complexity
function getCommonMomentRanges(events, enoughOpenedForRobbery) {
    events.sort((first, second) => {
        let result = first.time - second.time;
        if (result !== 0) {
            return result;
        }

        return first.type - second.type;
    });
    let openedCount = 0;
    const notStarted = timeBeforeStart - 1;
    let rangeStarted = notStarted;
    const ranges = [];
    for (let event of events) {
        openedCount += (event.type === open) ? 1 : -1;
        if (openedCount >= enoughOpenedForRobbery && rangeStarted === notStarted) {
            rangeStarted = event.time;
        }
        if (openedCount < enoughOpenedForRobbery && rangeStarted !== notStarted) {
            ranges.push({ from: rangeStarted, to: event.time });
            rangeStarted = notStarted;
        }
    }

    return ranges;
}

function getDay(timeInMinutes) {
    const dayNumber = Math.floor(timeInMinutes / minutesInDay);

    return dayNames[dayNumber];
}

function formatNumber(number) {
    return number < 10 ? '0' + number : number;
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
module.exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    const bankTimeZone = parseInt(workingHours.from[workingHours.from.length - 1]);
    timeBeforeStart = getMinutesFromWeekStart('ПН 00:00+' + bankTimeZone);
    timeAfterEnd = getMinutesFromWeekStart('ВС 23:59+' + bankTimeZone);
    let bankEvents = getEventsFromBankWorkingHours(workingHours);
    for (let key of Object.keys(schedule)) {
        bankEvents = bankEvents.concat(getEventsFromRobberSchedule(schedule[key]));
    }
    const commonMomentRanges = getCommonMomentRanges(bankEvents, Object.keys(schedule).length + 1);
    let robberyRanges = [];
    for (let range of commonMomentRanges) {
        if (range.to - range.from >= duration) {
            robberyRanges.push({ from: range.from, to: range.to - duration });
        }
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyRanges.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberyRanges.length === 0) {
                return '';
            }
            const timeInBankTimezone = robberyRanges[0].from + bankTimeZone * minutesInHour;
            const day = getDay(timeInBankTimezone);
            const hour = formatNumber(Math.floor(timeInBankTimezone / 60) % 24);
            const minute = formatNumber(timeInBankTimezone % 60);
            template = template.replace('%DD', day);
            template = template.replace('%HH', hour);
            template = template.replace('%MM', minute);

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robberyRanges.length === 0) {
                return false;
            }

            const minimalTime = robberyRanges[0].from + 30;

            for (let i = 0; i < robberyRanges.length; ++i) {
                if (robberyRanges[i].to >= minimalTime) {
                    robberyRanges = robberyRanges.slice(i);
                    robberyRanges[0].from = Math.max(robberyRanges[0].from, minimalTime);

                    return true;
                }
            }

            return false;
        }
    };
};

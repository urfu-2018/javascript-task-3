'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
let appropriateMoments;
let bankWorkingHours;
const newSchedule = { 'ПН': [], 'ВТ': [], 'СР': [], 'ЧТ': [], 'ПТ': [], 'СБ': [], 'ВС': [] };
const appropriateDays = ['ПН', 'ВТ', 'СР'];
const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const DAYS_IN_WEEK = 7;

function parseToBankZone(inputStr) {
    let day = inputStr.slice(0, 2);

    const localHour = parseInt(inputStr.slice(3, 5));
    const minutes = parseInt(inputStr.slice(6, 8));
    const shift = parseInt(inputStr.slice(9, 11));
    let bankZoneHour = localHour - shift + bankWorkingHours.shift;
    let index = days.indexOf(day);
    if (bankZoneHour > HOURS_IN_DAY) {
        index++;
    }
    if (bankZoneHour < 0) {
        index--;
    }
    index = (DAYS_IN_WEEK + index) % DAYS_IN_WEEK;
    day = days[index];
    bankZoneHour = (HOURS_IN_DAY + bankZoneHour) % HOURS_IN_DAY;


    return { day: day, timestamp: bankZoneHour * MINUTES_IN_HOUR + minutes };
}

function getTimeRanges(robberSchedule) {
    const result = [];
    let leftBorder = 0;
    for (let i = 0; i < robberSchedule.length; i++) {
        if (robberSchedule[i].from >= leftBorder) {
            result.push({ from: leftBorder, to: robberSchedule[i].from });
        }
        leftBorder = robberSchedule[i].to;
    }

    const minutesInDay = HOURS_IN_DAY * MINUTES_IN_HOUR - 1;
    result.push({ from: leftBorder, to: minutesInDay });

    return result;
}

function getWorkingHours(workingHours) {
    const fromHour = parseInt(workingHours.from.slice(0, 2));
    const toHour = parseInt(workingHours.to.slice(0, 2));
    const shift = parseInt(workingHours.from.slice(6));
    const fromMinutes = parseInt(workingHours.from.slice(3, 5));
    const toMinutes = parseInt(workingHours.to.slice(3, 5));

    return {
        shift: shift,
        from: fromHour * MINUTES_IN_HOUR + fromMinutes,
        to: toHour * MINUTES_IN_HOUR + toMinutes

    };
}

function fillSchedule(robberSchedule) {
    const fromInBankZone = parseToBankZone(robberSchedule.from);
    const toInBankZone = parseToBankZone(robberSchedule.to);
    if (fromInBankZone.day === toInBankZone.day) {
        newSchedule[fromInBankZone.day].push(
            { from: fromInBankZone.timestamp, to: toInBankZone.timestamp });

        return;
    }
    newSchedule[fromInBankZone.day].push(
        {
            from: fromInBankZone.timestamp,
            to: HOURS_IN_DAY * MINUTES_IN_HOUR - 1
        });
    newSchedule[toInBankZone.day].push({
        from: 0,
        to: toInBankZone.timestamp
    });

    return newSchedule;
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
    bankWorkingHours = getWorkingHours(workingHours);

    for (let propName in schedule) {
        if (!Array.isArray(schedule[propName])) {
            continue;
        }
        const robberSchedule = schedule[propName];
        for (let i = 0; i < robberSchedule.length; i++) {
            fillSchedule(robberSchedule[i]);
        }
    }
    appropriateMoments = Object.keys(newSchedule)
        .filter(x => appropriateDays.includes(x))
        .map(x => {
            return getTimeRanges(newSchedule[x].sort((y, z) => y.from - z.from))
                .map(a => {
                    const rightBorder = Math.min(bankWorkingHours.to, a.to);
                    const leftBorder = Math.max(bankWorkingHours.from, a.from);

                    return { day: x, from: leftBorder, to: rightBorder };
                })
                .filter(a => a.from !== a.to && a.to - a.from >= duration);
        })
        .filter(x => x.length !== 0)
        .reduce((x, y) => x.concat(y), []);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return appropriateMoments.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (appropriateMoments.length === 0) {
                return '';
            }

            return template.replace(
                '%HH', Math.floor(appropriateMoments[0].from / 60))
                .replace('%MM', (appropriateMoments[0].from % 60).toString()
                    .padStart(2, '0'))
                .replace('%DD', appropriateMoments[0].day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (appropriateMoments.length <= 1) {
                return false;
            }
            if (appropriateMoments[0].from + 30 + duration <= appropriateMoments[0].to) {
                appropriateMoments[0].from = appropriateMoments[0].from + 30;

                return true;
            }
            appropriateMoments.splice(0, 1);

            return true;
        }
    };
}

module.exports = {
    getAppropriateMoment,
    parseToBankZone,
    isStar
};

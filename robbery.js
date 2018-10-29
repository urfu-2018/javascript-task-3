'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
let appropriateMoments;
let bankWorkingHours;
const newSchedule = { 'ПН': [], 'ВТ': [], 'СР': [], 'ЧТ': [], 'ПТ': [], 'СБ': [], 'ВС': [] };
const days = ['ПН', 'ВТ', 'СР'];

function parseToBankZone(inputStr) {
    let day = inputStr.slice(0, 2);

    const localHour = parseInt(inputStr.slice(3, 5));
    const minutes = parseInt(inputStr.slice(6, 8));
    const shift = parseInt(inputStr.slice(9, 11));
    let bankZoneHour = localHour - shift + bankWorkingHours.shift;

    if (bankZoneHour < 0) {
        bankZoneHour = (24 + bankZoneHour) % 24;
        const dayIndex = (7 + days.indexOf(day)) % 7;
        day = days[dayIndex];
    }

    return { day: day, minutes: bankZoneHour * 60 + minutes };
}

function getTimeRanges(scheduleInDay, dayName) {
    const result = [];
    let leftBorder = 0;
    for (let i = 0; i < scheduleInDay.length; i++) {
        if (scheduleInDay[i].from.minutes >= leftBorder) {
            result.push({ day: dayName, from: leftBorder, to: scheduleInDay[i].from.minutes });
        }
        leftBorder = scheduleInDay[i].to.minutes;
    }

    const minutesInDay = 23 * 60 + 59;
    result.push({ day: dayName, from: leftBorder, to: minutesInDay });

    return result;
}

function getWorkingHours(workingHours) {
    const fromHour = parseInt(workingHours.from.slice(0, 2));
    const toHour = parseInt(workingHours.to.slice(0, 2));
    const shift = parseInt(workingHours.from.slice(6));

    return {
        shift: shift,
        from: {
            minutes: (24 + fromHour) % 24 * 60 + parseInt(workingHours.from.slice(3, 5))
        },
        to: {
            minutes: (24 + toHour) % 24 * 60 + parseInt(workingHours.to.slice(3, 5))
        }
    };
}

function fillSchedule(robberSchedule, robberName) {
    const fromInBankZone = parseToBankZone(robberSchedule.from);
    const toInBankZone = parseToBankZone(robberSchedule.to);
    if (fromInBankZone.day === toInBankZone.day) {
        newSchedule[fromInBankZone.day].push(
            { name: robberName, from: fromInBankZone, to: toInBankZone });

        return;
    }
    newSchedule[fromInBankZone.day].push(
        {
            name: robberName,
            from: fromInBankZone,
            to: { day: fromInBankZone.day, minutes: 23 * 60 + 59 }
        });
    newSchedule[toInBankZone.day].push({
        name: robberName,
        from: { day: toInBankZone.day, minutes: 0 },
        to: toInBankZone
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
            fillSchedule(robberSchedule[i], propName);
        }
    }
    appropriateMoments = Object.keys(newSchedule)
        .filter(x => days.includes(x))
        .map(x => newSchedule[x]
            .sort((y, z) => y.from.minutes - z.from.minutes))
        .map(x => {
            return getTimeRanges(x, x[0].from.day)
                .filter(a => a.from !== a.to)
                .map(a => {
                    const rightBorder = Math.min(bankWorkingHours.to.minutes, a.to);
                    const leftBorder = Math.max(bankWorkingHours.from.minutes, a.from);

                    return { day: a.day, from: leftBorder, to: rightBorder };
                })
                .filter(a => a.to - a.from >= duration);
        })
        .filter(x => x.length !== 0);

    if (appropriateMoments.length !== 0) {
        appropriateMoments = appropriateMoments.reduce((x, y) => x.concat(y));
    }

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

    isStar
};

'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
let appropriateMoments;
let bankWorkingHours;
const newSchedule = { 'ПН': [], 'ВТ': [], 'СР': [] };

function parseToUtc(inputStr) {
    let day = inputStr.slice(0, 2);

    const localHour = parseInt(inputStr.slice(3, 5));
    const minutes = parseInt(inputStr.slice(6, 8));
    const shift = parseInt(inputStr.slice(9, 11));
    let fromUtcHour = localHour - shift;

    if (fromUtcHour < 0) {
        fromUtcHour = (24 + fromUtcHour) % 24;
        day = (7 + day) % day;
    }

    return { day: day, minutes: fromUtcHour * 60 + minutes };
}

function getTimeRanges(scheduleInDay, dayName) {
    const result = [];
    let leftBorder = 0;
    for (let i = 0; i < scheduleInDay.length; i++) {
        if (scheduleInDay[i].fromInUtc.minutes >= leftBorder) {
            result.push({ day: dayName, from: leftBorder, to: scheduleInDay[i].fromInUtc.minutes });
        }
        leftBorder = scheduleInDay[i].toInUtc.minutes;
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
        fromInUtc: {
            minutes: (24 + fromHour - shift) % 24 * 60 + parseInt(workingHours.from.slice(3, 5))
        },
        toInUtc: {
            minutes: (24 + toHour - shift) % 24 * 60 + parseInt(workingHours.to.slice(3, 5))
        }
    };
}

function fillSchedule(robberSchedule, robberName) {
    const fromInUtc = parseToUtc(robberSchedule.from);
    const toInUtc = parseToUtc(robberSchedule.to);
    if (fromInUtc.day === toInUtc.day) {
        newSchedule[fromInUtc.day].push(
            { name: robberName, fromInUtc: fromInUtc, toInUtc: toInUtc });

        return;
    }
    newSchedule[fromInUtc.day].push(
        {
            name: robberName,
            fromInUtc: fromInUtc,
            toInUtc: { day: fromInUtc.day, minutes: 23 * 60 + 59 }
        });
    newSchedule[toInUtc.day].push({
        name: robberName,
        fromInUtc: { day: toInUtc.day, minutes: 0 },
        toInUtc: toInUtc
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
        .map(x => newSchedule[x]
            .sort((y, z) => y.fromInUtc.minutes - z.fromInUtc.minutes))
        .map(x => {
            return getTimeRanges(x, x[0].fromInUtc.day)
                .filter(a => a.from !== a.to)
                .map(a => {
                    const rightBorder = Math.min(bankWorkingHours.toInUtc.minutes, a.to);
                    const leftBorder = Math.max(bankWorkingHours.fromInUtc.minutes, a.from);

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
                '%HH', Math.floor(appropriateMoments[0].from / 60) + bankWorkingHours.shift)
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

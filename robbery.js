'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
let appropriateMoments;
let bankWorkingHours;
const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MINUTES_IN_DAY = MINUTES_IN_HOUR * HOURS_IN_DAY;

function parseToBankZone(inputStr) {
    let day = inputStr.slice(0, 2);

    const localHour = parseInt(inputStr.slice(3, 5));
    const minutes = parseInt(inputStr.slice(6, 8));
    const shift = parseInt(inputStr.slice(9, 11));
    let bankZoneHour = localHour - shift + bankWorkingHours.shift;
    let index = days.indexOf(day);

    return index * MINUTES_IN_DAY + bankZoneHour * MINUTES_IN_HOUR + minutes;
}

function getTimeRanges(robberSchedule) {
    const result = [];
    let leftBorder = 0;
    robberSchedule.forEach(x => {
        result.push({ from: leftBorder, to: x.from });
        leftBorder = x.to;
    });

    result.push({ from: leftBorder, to: MINUTES_IN_DAY * 3 - 1 });

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

function getIntersect(firstSchedule, secondSchedule) {
    const intersection = [];
    firstSchedule.forEach(first => {
        secondSchedule.forEach(second => {
            if (first.to > second.from && first.from < second.to) {
                intersection.push(
                    { from: Math.max(first.from, second.from), to: Math.min(first.to, second.to) });
            }
        });
    });

    return intersection;
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

    appropriateMoments = Object.keys(schedule)
        .map(s => schedule[s]
            .map(x => ({
                from: parseToBankZone(x.from),
                to: parseToBankZone(x.to)
            }))
            .sort((x, y) => x.from - y.from))
        .map(x => getTimeRanges(x));

    appropriateMoments.push([0, 1, 2].map(x => {
        return {
            from: bankWorkingHours.from + x * MINUTES_IN_DAY,
            to: bankWorkingHours.to + x * MINUTES_IN_DAY
        };
    }));

    appropriateMoments = appropriateMoments
        .reduce((x, y) => getIntersect(x, y))
        .filter(x => x.to - x.from >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return appropriateMoments.length > 0;
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
                '%HH', Math.floor(appropriateMoments[0].from % MINUTES_IN_DAY / MINUTES_IN_HOUR))
                .replace('%MM', (appropriateMoments[0].from % MINUTES_IN_HOUR).toString()
                    .padStart(2, '0'))
                .replace('%DD', days[Math.floor(appropriateMoments[0].from / MINUTES_IN_DAY)]);
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

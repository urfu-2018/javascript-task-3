'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

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
    var offset = parseInt(workingHours.from.slice(6));
    const bankTimes = getBankWorkingTimes(workingHours, offset);
    const gangBusyTimes = {
        Danny: schedule.Danny.map(x => createPeriod(x, offset)),
        Linus: schedule.Linus.map(x => createPeriod(x, offset)),
        Rusty: schedule.Rusty.map(x => createPeriod(x, offset))
    };

    var robberyTimes = getRobberyTimes(gangBusyTimes, bankTimes, offset)
        .filter(t => t.to - t.from >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyTimes.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberyTimes.length === 0) {
                return '';
            }

            return formatDate(createCustomDateObject(robberyTimes[0].from), template);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robberyTimes.length === 0) {
                return false;
            }
            var currentPeriod = robberyTimes[0];
            if (currentPeriod.to - currentPeriod.from >= duration + 30) {
                robberyTimes[0].from += 30;

                return true;
            }

            if (robberyTimes.length > 1) {
                robberyTimes.shift();

                return true;
            }

            return false;
        }
    };
}

function getRobberyTimes(gangBusyTimes, bankTimes, offset) {
    const dannyPossibleTimes = invertPeriods(gangBusyTimes.Danny, offset);
    const linusPossibleTimes = invertPeriods(gangBusyTimes.Linus, offset);
    const rustyPossibleTimes = invertPeriods(gangBusyTimes.Rusty, offset);

    let possibleTimes = getTimeIntersections(dannyPossibleTimes, linusPossibleTimes);
    possibleTimes = getTimeIntersections(possibleTimes, rustyPossibleTimes);
    possibleTimes = getTimeIntersections(possibleTimes, bankTimes);

    return possibleTimes;
}

function getTimeIntersections(firstTime, secondTime) {
    var commonTimes = [];
    firstTime.forEach(first => {
        secondTime.forEach(second => {
            commonTimes.push(getPeriodsIntersection(first, second));
        });
    });

    return commonTimes.filter(date => date !== undefined);
}

function formatDate(customDate, template) {
    const addLeadingZero = (number) => number.toString().length === 1 ? `0${number}` : number;

    return template
        .replace('%HH', addLeadingZero(customDate.hours))
        .replace('%MM', addLeadingZero(customDate.minutes))
        .replace('%DD', addLeadingZero(customDate.day));
}

function createCustomDateObject(minutes) {
    const dayNames = ['ПН', 'ВТ', 'СР'];

    return {
        day: dayNames[Math.floor(minutes / (60 * 24))],
        hours: Math.floor(minutes / 60) % 24,
        minutes: minutes % 60
    };
}

function invertPeriods(periods, offset) {
    periods.sort((a, b) => a.from - b.to);

    const rightBorder = getMinutes(`СР 23:59+${offset}`, offset);
    let leftBorder = getMinutes(`ПН 00:00+${offset}`, offset);

    let newPeriods = [];
    periods.forEach(period => {
        newPeriods.push({ from: leftBorder, to: period.from });
        leftBorder = period.to;
    });
    newPeriods.push({ from: leftBorder, to: rightBorder });

    return newPeriods;
}

function getPeriodsIntersection(first, second) {
    const isPeriodsNested = (a, b) =>
        a.from < b.from && a.to > b.to || b.from < a.from && b.to > a.to;

    const isPeriodsIntersect = (a, b) => a.to >= b.from && b.to >= a.from;

    if (isPeriodsNested(first, second)) {
        return {
            from: Math.max(first.from, second.from),
            to: Math.min(first.to, second.to)
        };
    }

    if (isPeriodsIntersect(first, second)) {
        return {
            from: Math.max(first.from, second.from),
            to: Math.min(first.to, second.to)
        };
    }
}

function getBankWorkingTimes(bankWorkingHours, offset) {
    return [
        {
            from: getMinutes(`ПН ${bankWorkingHours.from}`, offset),
            to: getMinutes(`ПН ${bankWorkingHours.to}`, offset)
        },
        {
            from: getMinutes(`ВТ ${bankWorkingHours.from}`, offset),
            to: getMinutes(`ВТ ${bankWorkingHours.to}`, offset)
        },
        {
            from: getMinutes(`СР ${bankWorkingHours.from}`, offset),
            to: getMinutes(`СР ${bankWorkingHours.to}`, offset)
        }
    ];
}

function createPeriod(stringPeriod, bankTimeZone) {
    return {
        from: getMinutes(stringPeriod.from, bankTimeZone),
        to: getMinutes(stringPeriod.to, bankTimeZone)
    };
}

const hoursByDayName = new Map(
    [
        ['ПН', 24 * 0],
        ['ВТ', 24 * 1],
        ['СР', 24 * 2]
    ]
);

function getMinutes(dateString, offset) {
    let day = dateString.slice(0, 2);
    let hours = parseInt(dateString.slice(3, 5)) - parseInt(dateString.slice(9)) + offset;
    let minutes = parseInt(dateString.slice(6, 8));

    return (hoursByDayName.get(day) + hours) * 60 + minutes;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

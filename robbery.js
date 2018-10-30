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
    let bankTime = parseInt(workingHours.from.slice(6));
    const workingDays = getWorkingDates(workingHours, bankTime);
    // console.info('working:');
    // console.info(workingDays);
    const dannyPossibleTimes = invertPeriods(schedule.Danny
        .map(x => createPeriod(x, bankTime)), bankTime);
    // console.info('danny:');
    // console.info(dannyPossibleTimes);
    const linusPossibleTimes = invertPeriods(schedule.Linus
        .map(x => createPeriod(x, bankTime)), bankTime);
    // console.info('linus:');
    // console.info(linusPossibleTimes);
    const rustyPossibleTimes = invertPeriods(schedule.Rusty
        .map(x => createPeriod(x, bankTime)), bankTime);
    // console.info('rusty:');
    // console.info(rustyPossibleTimes);
    // throw new Error();
    var possibleTimes = getTimeIntersections(dannyPossibleTimes, linusPossibleTimes);

    possibleTimes = getTimeIntersections(possibleTimes, rustyPossibleTimes);
    possibleTimes = getTimeIntersections(possibleTimes, workingDays);
    // console.info('kek');
    // console.info(possibleTimes);
    var appropriateTimes = possibleTimes
        .filter(t => t.to - t.from >= duration);
    // console.info('kek');
    // console.info(appropriateTimes);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return appropriateTimes.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (appropriateTimes.length === 0) {
                return '';
            }
            const start = createCustomDateObject(appropriateTimes[0].from);

            return formatDate(start, template);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (appropriateTimes.length === 0) {
                return false;
            }
            var currentPeriod = appropriateTimes[0];
            if (currentPeriod.to - currentPeriod.from >= duration + 30) {
                appropriateTimes[0].from += 30;

                return true;
            }

            if (appropriateTimes.length > 1) {
                appropriateTimes.shift();

                return true;
            }

            return false;
        }
    };
}

function formatDate(customDate, template) {
    const addLeadingZero = number => number.toString().length === 1 ? `0${number}` : number;

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

function invertPeriods(periods, bankTimeZone) {
    periods.sort((a, b)=>a.from - b.to);
    const rightBorder = getMinutes(`СР 23:59+${bankTimeZone}`, bankTimeZone);
    let leftBorder = getMinutes(`ПН 00:00+${bankTimeZone}`, bankTimeZone);
    const newPeriods = [];
    periods.forEach(period => {
        newPeriods.push({ from: leftBorder, to: period.from });
        leftBorder = period.to;
    });
    newPeriods.push({ from: leftBorder, to: rightBorder });

    return newPeriods;
}

function getPeriodsIntersection(firstPeriod, secondPeriod) {
    if (isPeriodsNested(firstPeriod, secondPeriod)) {
        return {
            from: Math.max(firstPeriod.from, secondPeriod.from),
            to: Math.min(firstPeriod.to, secondPeriod.to)
        };
    }

    if (isPeriodsIntersect(firstPeriod, secondPeriod)) {
        return {
            from: Math.max(firstPeriod.from, secondPeriod.from),
            to: Math.min(firstPeriod.to, secondPeriod.to)
        };
    }
}

function isPeriodsNested(period1, period2) {
    return period1.from < period2.from && period1.to > period2.to ||
    period2.from < period1.from && period2.to > period1.to;
}

function isPeriodsIntersect(period1, period2) {
    return period1.to >= period2.from && period2.to >= period1.from;
}

function getTimeIntersections(firstSchedule, secondSchedule) {
    var commonTimes = [];
    firstSchedule.forEach(first => {
        secondSchedule.forEach(second => {
            commonTimes.push(getPeriodsIntersection(first, second));
        });
    });

    return commonTimes.filter(date => date !== undefined);
}

function getWorkingDates(bankWorkingHours, bankTimeZone) {
    return [
        {
            from: getMinutes(`ПН ${bankWorkingHours.from}`, bankTimeZone),
            to: getMinutes(`ПН ${bankWorkingHours.to}`, bankTimeZone)
        },
        {
            from: getMinutes(`ВТ ${bankWorkingHours.from}`, bankTimeZone),
            to: getMinutes(`ВТ ${bankWorkingHours.to}`, bankTimeZone)
        },
        {
            from: getMinutes(`СР ${bankWorkingHours.from}`, bankTimeZone),
            to: getMinutes(`СР ${bankWorkingHours.to}`, bankTimeZone)
        }
    ];
}

function createPeriod(stringPeriod, bankTimeZone) {
    return {
        from: getMinutes(stringPeriod.from, bankTimeZone),
        to: getMinutes(stringPeriod.to, bankTimeZone)
    };
}

const dayNameToHours = new Map(
    [['ПН', 24 * 0],
        ['ВТ', 24 * 1],
        ['СР', 24 * 2]]
);

function getMinutes(dateString, bankTimeZone) {
    let day = dateString.slice(0, 2);
    let hours = parseInt(dateString.slice(3, 5)) - parseInt(dateString.slice(9)) + bankTimeZone;
    let minutes = parseInt(dateString.slice(6, 8));

    return (dayNameToHours.get(day) + hours) * 60 + minutes;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

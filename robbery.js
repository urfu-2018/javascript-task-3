'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

const momentPattern = /^([А-Я]{2}) (.+)$/;

const minutesInAHour = 60;
const hoursInADay = 24;
const minutesInADay = minutesInAHour * hoursInADay;
const firstImpossibleDay = weekDays.indexOf('ЧТ');

function parseMoment(momentString) {
    const tokens = momentString.match(momentPattern);
    const day = weekDays.indexOf(tokens[1]);
    const moment = parseTime(tokens[2]);
    moment.day = day;

    return moment;
}

const timePattern = /^(\d{2}):(\d{2})(\+\d{1,2})?$/;

function parseTime(timeline) {
    const tokens = timeline.match(timePattern);
    const timeZone = tokens[3] ? Number.parseInt(tokens[3]) : 0;

    return {
        hours: Number.parseInt(tokens[1]),
        minutes: Number.parseInt(tokens[2]),
        timeZone: timeZone
    };
}

function momentToMinutes(time, bankTimeZone = 0) {
    return (time.day ? time.day : 0) * minutesInADay +
        (time.hours - time.timeZone + bankTimeZone) * minutesInAHour +
        time.minutes;
}

function getDay(minutes) {
    return Math.trunc(Math.trunc(minutes / minutesInAHour) / hoursInADay);
}

function getHoursAndMinutes(minutes) {
    return minutes - getDay(minutes) * hoursInADay * minutesInAHour;
}

function minutesToMoment(minutes) {
    const hoursAndMinutes = getHoursAndMinutes(minutes);

    return {
        day: getDay(minutes),
        hours: Math.trunc(hoursAndMinutes / minutesInAHour),
        minutes: hoursAndMinutes % minutesInAHour
    };
}

function pairToInterval(pair, parser, bankTimeZone) {
    return [pair.from, pair.to]
        .map(parser)
        .map(time => momentToMinutes(time, bankTimeZone));
}

function intersect(first, second) {
    if (!first || !second) {
        return undefined;
    }

    const left = Math.max(first[0], second[0]);
    const right = Math.min(first[1], second[1]);

    return left < right ? [left, right] : undefined;
}

function formatDate(pattern, moment) {
    const formatByZero = subject => (subject < 10 ? '0' : '') + subject;

    return pattern.replace('%HH', formatByZero(moment.hours))
        .replace('%MM', formatByZero(moment.minutes))
        .replace('%DD', weekDays[moment.day]);
}

function intervalLength(interval) {
    return interval[1] - interval[0];
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
    const bankTimeZone = parseTime(workingHours.from).timeZone;
    const bankWorkInterval = pairToInterval(workingHours, parseTime, bankTimeZone);
    const impossibleTimes = Object
        .values(schedule)
        .flat()
        // .reduce((x, y) => x.concat(y))
        .map(pair => pairToInterval(pair, parseMoment, bankTimeZone))
        .concat([[0, 0], [firstImpossibleDay * minutesInADay, weekDays.length * minutesInADay]]);
    const borders = impossibleTimes.reduce((x, y) => x.concat(y));
    let possibleTimes = [];
    let day = 0;
    while (day < 3) {
        let start = day * minutesInADay + bankWorkInterval[0];
        let end = day * minutesInADay + bankWorkInterval[1];
        possibleTimes = possibleTimes.concat(
            [...new Set(borders.filter(b => b >= start && b <= end))]
                .concat(start, end)
                .sort((x, y) => x - y)
                .map((_, index, array) => index > 0 ? [array[index - 1], array[index]] : null)
                .slice(1)
                .filter(pair => intervalLength(pair) >= duration)
        );
        day++;
    }
    possibleTimes = possibleTimes
        .filter(pair => impossibleTimes
            .every(impossible => intersect(impossible, pair) === undefined));

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return possibleTimes.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (possibleTimes.length === 0) {
                return '';
            }
            const firstPossible = minutesToMoment(possibleTimes[0][0]);

            return formatDate(template, firstPossible);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const temporaryTimes = possibleTimes.slice();
            if (temporaryTimes.length > 0) {
                temporaryTimes[0] = [temporaryTimes[0][0] + 30, temporaryTimes[0][1]];
                // Как ниже нельзя, будет копирование
                // temporaryTimes[0][0] += 30
            }

            while (temporaryTimes.length > 0) {
                const firstPossible = temporaryTimes[0];
                if (intervalLength(firstPossible) >= duration) {
                    possibleTimes = temporaryTimes;

                    return true;
                }
                temporaryTimes.shift();
            }

            return false;
        }
    };
}

// noinspection JSUnresolvedVariable
module.exports = {
    getAppropriateMoment,
    isStar
};

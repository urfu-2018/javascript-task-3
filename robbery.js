'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

const momentPattern = /^([А-Я]{2}) (.+)$/;

const minutesInAHour = 60;
const hoursInDay = 24;
const minutesInADay = minutesInAHour * hoursInDay;

/**
 * Парсит момент
 * @param {String} momentString
 * @returns {Object}
 */
function parseMoment(momentString) {
    const tokens = momentString.match(momentPattern);
    const day = weekDays.indexOf(tokens[1]);
    const moment = parseTime(tokens[2]);
    moment.day = day;

    return moment;
}

const timePattern = /^(\d{2}):(\d{2})(\+\d{1,2})?$/;

/**
 * Парсит время
 * @param {String} timeline
 * @returns {Object}
 */
function parseTime(timeline) {
    const tokens = timeline.match(timePattern);
    const timeZone = tokens[3] ? parseInt(tokens[3]) : 0;

    return {
        hours: Number.parseInt(tokens[1]),
        minutes: Number.parseInt(tokens[2]),
        timeZone: timeZone
    };
}

/**
 * Переводит момент в минуты с учетом часового пояса банка
 * @param {Number} time
 * @param {Number} bankTimeZone
 * @returns {Number}
 */
function momentToMinutes(time, bankTimeZone = 0) {
    const result = (time.day ? time.day : 0) * minutesInADay +
        (time.hours - time.timeZone + bankTimeZone) * minutesInAHour +
        time.minutes;

    return result;
}

/**
 * По минутам отдает только день
 * @param {Number} minutes
 * @returns {Number}
 */
function getTheDay(minutes) {
    return Math.trunc(Math.trunc(minutes / minutesInAHour) / hoursInDay);
}

/**
 * По минутам отдает часы и минуты
 * @param {Number} minutes
 * @returns {Number}
 */
function getHoursAndMinutes(minutes) {
    return minutes - getTheDay(minutes) * hoursInDay * minutesInAHour;
}

/**
 * Переводит из минут в момент
 * @param {Number} minutes
 * @returns {Object}
 */
function minutesToMoment(minutes) {
    const hoursAndMinutes = getHoursAndMinutes(minutes);

    return {
        day: getTheDay(minutes),
        hours: Math.trunc(hoursAndMinutes / minutesInAHour),
        minutes: hoursAndMinutes % minutesInAHour
    };
}

/**
 * Пару с-до переводит в интервал времени
 * @param {Object} pair
 * @param {Function} parser
 * @param {String} bankTimeZone
 * @returns {Object}
 */
function pairToInterval(pair, parser, bankTimeZone) {
    return [pair.from, pair.to]
        .map(parser)
        .map(time => momentToMinutes(time, bankTimeZone));
}

/**
 * Проверяет пересечения
 * @param {String} time1
 * @param {String} time2
 * @returns {Boolean}
 */
function intersect(time1, time2) {
    if (!time1 || !time2) {
        return undefined;
    }

    const left = Math.max(time1[0], time2[0]);
    const right = Math.min(time1[1], time2[1]);

    return left < right ? [left, right] : undefined;
}

/**
 * Изменяет формат даты
 * @param {String} pattern
 * @param {Object} moment
 * @returns {String}
 */
function newFormatOfDate(pattern, moment) {
    return pattern.replace('%HH', (moment.hours < 10 ? '0' : '') + moment.hours)
        .replace('%MM', (moment.minutes < 10 ? '0' : '') + moment.minutes)
        .replace('%DD', weekDays[moment.day]);
}

/**
 * @param {Object} schedule – Расписание
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} HoursOfWork – Время работы банка
 * @param {String} HoursOfWork.from – Время открытия, например, "10:00+5"
 * @param {String} HoursOfWork.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, HoursOfWork) {
    console.info(schedule, duration, HoursOfWork);
    const bankTimeZone = parseTime(HoursOfWork.from).timeZone;
    const bankWorkInterval = pairToInterval(HoursOfWork, parseTime, bankTimeZone);
    const impossibleTimes = Object.keys(schedule)
        .map(key => schedule[key])
        .reduce((x, y) => x.concat(y))
        .map(pair => pairToInterval(pair, parseMoment, bankTimeZone))
        .concat([[0, 0], [4 * minutesInADay, 7 * minutesInADay]]);
    const borders = impossibleTimes.reduce((x, y) => x.concat(y));
    let possibleTimes = [];
    let day = 0;
    while (day < 3) {
        let start = day * minutesInADay + bankWorkInterval[0];
        let end = day * minutesInADay + bankWorkInterval[1];
        possibleTimes = possibleTimes.concat(
            [...new Set(borders.filter(b => b >= start && b <= end))]
                .concat([start, end])
                .sort((x, y) => x - y)
                .map((_, index, array) => index > 0 ? [array[index - 1], array[index]] : null)
                .slice(1)
                .filter(pair => pair[1] - pair[0] >= duration)
        );
        day++;
    }
    possibleTimes = possibleTimes
        .filter(pair => impossibleTimes.every(i => intersect(i, pair) === undefined));

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

            return newFormatOfDate(template, firstPossible);
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
            }

            while (temporaryTimes.length > 0) {
                const firstPossible = temporaryTimes[0];
                if (firstPossible[1] - firstPossible[0] >= duration) {
                    possibleTimes = temporaryTimes;

                    return true;
                }
                temporaryTimes.shift();
            }

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

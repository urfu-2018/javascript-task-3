'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;


const daysToIndexMap = new Map([['ПН', 0], ['ВТ', 1], ['СР', 2]]);
const days = ['ПН', 'ВТ', 'СР'];


const timeRegEx = /^(\d{2}):(\d{2})\+(\d{1,2})$/;

function parseTime(time) {
    const match = timeRegEx.exec(time.trim());

    if (!match) {
        throw new RangeError();
    }

    const timezone = parseInt(match[3]);
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);

    return { hours, minutes, timezone };
}

function getMinutesSinceBase(datetime, bankTimezone) {
    return daysToIndexMap.get(datetime.day) * HOURS_IN_DAY * MINUTES_IN_HOUR +
        datetime.time.hours * MINUTES_IN_HOUR +
        datetime.time.minutes -
        (datetime.time.timezone - bankTimezone) * MINUTES_IN_HOUR;
}

function getBankIntervals(workingHours) {
    const startTime = parseTime(workingHours.from);
    const endTime = parseTime(workingHours.to);
    const bankTimezone = startTime.timezone;
    const intervals = [];
    for (let i = 0; i < days.length; i++) {
        intervals.push({
            start: getMinutesSinceBase({
                day: days[i],
                time: startTime
            }, bankTimezone),
            end: getMinutesSinceBase({
                day: days[i],
                time: endTime
            }, bankTimezone)
        });
    }

    return [intervals, bankTimezone];
}

function convertSegment(interval, bankTimezone) {
    const [startDay, startTime] = interval.from.split(' ');
    const [endDay, endTime] = interval.to.split(' ');

    return {
        start: getMinutesSinceBase({ day: startDay, time: parseTime(startTime) }, bankTimezone),
        end: getMinutesSinceBase({ day: endDay, time: parseTime(endTime) }, bankTimezone)
    };
}

function getRobberIntervals(segments, bankTimezone) {
    const convertedSegments =
        [...segments.map(segment => convertSegment(segment, bankTimezone))];
    const result = [];
    result.push({ start: -Infinity });
    for (let i = 0; i < convertedSegments.length; i++) {
        result[result.length - 1].end = convertedSegments[i].start;
        result.push({ start: convertedSegments[i].end });
    }
    result[result.length - 1].end = Infinity;

    return result;
}

function findAllIntersections(intervalsA, intervalsB) {
    function generatePairs() {
        const pairs = [];
        for (let i = 0; i < intervalsA.length; i++) {
            for (let j = 0; j < intervalsB.length; j++) {
                pairs.push([intervalsA[i], intervalsB[j]]);
            }
        }

        return pairs;
    }
    const intersections = [];
    generatePairs().forEach(pair =>{
        if (pair[0].end <= pair[1].start || pair[0].start >= pair[1].end) {
            return;
        }
        intersections.push({
            start: Math.max(pair[0].start, pair[1].start),
            end: Math.min(pair[0].end, pair[1].end)
        });
    });

    return intersections;
}

function findInterval(intervals, duration) {
    let exists = false;
    let time;
    for (let i = 0; i < intervals.length; i++) {
        if (intervals[i].end - intervals[i].start >= duration) {
            exists = true;
            const wholeHours = Math.floor(intervals[i].start / MINUTES_IN_HOUR);
            const wholeDays = Math.floor(wholeHours / HOURS_IN_DAY);
            let hours = (wholeHours % HOURS_IN_DAY).toString();
            hours = hours.length === 2 ? hours : '0' + hours;
            let minutes = (intervals[i].start % MINUTES_IN_HOUR).toString();
            minutes = minutes.length === 2 ? minutes : '0' + minutes;
            time = { day: days[wholeDays], hours, minutes };
            break;
        }
    }

    return { exists, time };
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
    const [bankSegments, bankTimezone] = getBankIntervals(workingHours);
    const linusInterval = getRobberIntervals(schedule.Linus, bankTimezone);
    const rustyInterval = getRobberIntervals(schedule.Rusty, bankTimezone);
    const dannyInterval = getRobberIntervals(schedule.Danny, bankTimezone);

    const intersections = findAllIntersections(
        linusInterval, findAllIntersections(rustyInterval, dannyInterval));
    const a = findAllIntersections(bankSegments, intersections);
    let { exists, time } = findInterval(a, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return exists;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }

            return template.replace('%DD', time.day)
                .replace('%HH', time.hours)
                .replace('%MM', time.minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

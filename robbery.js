'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const robberyDays = [0, 1, 2];
const members = ['Danny', 'Rusty', 'Linus'];

/**
 * Произвольный понедельник
 */
const baseDate = new Date(2018, 9, 22);
const weekdaysToDaysOffset = new Map([
    ['ПН', 0],
    ['ВТ', 1],
    ['СР', 2],
    ['ЧТ', 3],
    ['ПТ', 4],
    ['СБ', 5],
    ['ВС', 6]]);

const daysToWeekdays = new Map();
for (let day of weekdaysToDaysOffset.keys()) {
    daysToWeekdays.set(weekdaysToDaysOffset.get(day), day);
}

const dateTimeRegexp = /^(?:([^\d\s]{2}) )?(\d\d):(\d\d)(?:\+(\d{1,2}))?$/;

function parseTimeAsDatetime(str) {
    return customDatetimeObjectToDatetime(parseTimeString(str));
}

function parseTimeString(timeString) {
    const matcher = timeString.match(dateTimeRegexp);
    if (!matcher) {
        throw new Error();
    }
    const day = matcher[1] ? weekdaysToDaysOffset.get(matcher[1]) : 0;
    const hours = parseInt(matcher[2]);
    const minutes = parseInt(matcher[2 + 1]);
    const timezone = matcher[2 + 2] ? parseInt(matcher[2 + 2]) : 0;

    return {
        day: day,
        hours: hours,
        minutes: minutes,
        timezone: timezone
    };
}

function customDatetimeObjectToDatetime(obj) {
    return getDatetime(obj.day, obj.hours, obj.minutes, obj.timezone);
}

function getDatetime(days, hours, minutes, timezone) {
    const datetime = new Date(baseDate.getTime());
    datetime.setDate(datetime.getDate() + days);
    datetime.setHours(hours);
    datetime.setMinutes(minutes);
    datetime.setHours(datetime.getHours() - timezone);

    return datetime;
}

class TimePeriod {
    constructor(start, end) {
        this._from = start;
        this._to = end;
        this._lengthMinutes = (this.to.getTime() - this.from.getTime()) / 1000 / 60;
    }

    get from() {
        return this._from;
    }

    get to() {
        return this._to;
    }

    get lengthMinutes() {
        return this._lengthMinutes;
    }

    /**
     *
     * @param {Date} datetime
     * @returns {Boolean}
     */
    happensInPeriod(datetime) {
        return this.from <= datetime && datetime <= this.to;
    }

    /**
     * @param {TimePeriod} otherPeriod
     * @returns {Boolean}
     */
    intersectsWith(otherPeriod) {
        return this.happensInPeriod(otherPeriod.from) ||
            this.happensInPeriod(otherPeriod.to) ||
            otherPeriod.happensInPeriod(this.from) ||
            otherPeriod.happensInPeriod(this.to);
    }

    /**
     * @param {Object} period
     * @returns {TimePeriod}
     */
    static fromStringPeriodObject(period) {
        return new TimePeriod(parseTimeAsDatetime(period.from), parseTimeAsDatetime(period.to));
    }
}

/**
 * Вычитает из первого периода второй, при условии, что они пересекаются
 * @param {TimePeriod} timePeriod1
 * @param {TimePeriod} timePeriod2
 * @returns {TimePeriod[]} Получившиеся периоды
 */
function subtract(timePeriod1, timePeriod2) {
    if (timePeriod2.from <= timePeriod1.from && timePeriod1.to <= timePeriod2.to) {
        return [];
    }

    if (timePeriod1.from <= timePeriod2.from && timePeriod2.to <= timePeriod1.to) {
        return [
            new TimePeriod(timePeriod1.from, timePeriod2.from),
            new TimePeriod(timePeriod2.to, timePeriod1.to)];
    }

    if (timePeriod2.happensInPeriod(timePeriod1.from)) {
        return [new TimePeriod(timePeriod2.to, timePeriod1.to)];
    }

    return [new TimePeriod(timePeriod1.from, timePeriod2.from)];
}

/**
 * @param {TimePeriod[]} timePeriods Периоды - "уменьшаемые"
 * @param {TimePeriod} timePeriod период - вычитаемое
 * @returns {TimePeriod[]} Получившиеся периоды
 */
function subtractFromTimePeriods(timePeriods, timePeriod) {
    let newPeriods = [];
    for (let period of timePeriods) {
        if (period.intersectsWith(timePeriod)) {
            newPeriods = newPeriods.concat(subtract(period, timePeriod));
        } else {
            newPeriods.push(period);
        }
    }

    return newPeriods;
}

function getTimeZone(timeString) {
    const match = timeString.match(dateTimeRegexp);
    if (!match) {
        throw new Error();
    }

    return match[4] ? parseInt(match[4]) : 0;
}

/**
 * Заполняет строку нулями слева до желаемой длины
 * @param {String} str
 * @param {Number} length
 * @returns {String}
 */
function zfill(str, length) {
    let result = str;
    while (result.length < length) {
        result = '0' + result;
    }

    return result;
}

function addBankWorkingHours(timePeriodsAvailable, workingHours) {
    const workingHoursFrom = parseTimeString(workingHours.from);
    const workingHoursTo = parseTimeString(workingHours.to);
    for (let day of robberyDays) {
        workingHoursFrom.day = workingHoursTo.day = day;
        timePeriodsAvailable.push(new TimePeriod(
            customDatetimeObjectToDatetime(workingHoursFrom),
            customDatetimeObjectToDatetime(workingHoursTo)));
    }
}

function findFirstFittingPeriodStart(periods, minLengthMinutes) {
    let suitingStart = null;
    for (let period of periods) {
        if (period.lengthMinutes >= minLengthMinutes) {
            suitingStart = period.from;
            break;
        }
    }

    return suitingStart;
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @param {Date} availableTimeStart - (необязательный) самое раннее возможное время ограбления
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours, availableTimeStart) {
    console.info(schedule, duration, workingHours);
    const bankTimeZone = getTimeZone('ПН ' + workingHours.from);
    let timePeriodsAvailable = [];

    addBankWorkingHours(timePeriodsAvailable, workingHours);

    if (availableTimeStart) {
        timePeriodsAvailable = subtractFromTimePeriods(timePeriodsAvailable,
            new TimePeriod(parseTimeAsDatetime(workingHours.from), availableTimeStart));
    }

    for (let member of members) {
        const memberSchedule = schedule[member];
        for (let rawPeriod of memberSchedule) {
            timePeriodsAvailable = subtractFromTimePeriods(timePeriodsAvailable,
                TimePeriod.fromStringPeriodObject(rawPeriod));
        }
    }

    let suitingStart = findFirstFittingPeriodStart(timePeriodsAvailable, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(suitingStart);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!suitingStart) {
                return '';
            }
            let date = new Date(suitingStart.getTime());
            date.setHours(date.getHours() + bankTimeZone);
            // +6 = +7 - 1: getDay() возвращает индекс дня недели, причем в началае стоит ВС,
            // а не ПН, поэтому нужно дни недели сдвинуть
            const weekday = daysToWeekdays.get((date.getDay() + 6) % 7);

            return template
                .replace('%HH', zfill(date.getHours().toString(), 2))
                .replace('%MM', zfill(date.getMinutes().toString(), 2))
                .replace('%DD', weekday);
        },

        getStart: function () {
            return suitingStart;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!suitingStart) {
                return false;
            }

            const time = new Date(suitingStart.getTime());
            time.setMinutes(time.getMinutes() + 30);
            const result = getAppropriateMoment(schedule, duration, workingHours, time);
            if (result.exists()) {
                suitingStart = result.getStart();
            }

            return result.exists();
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

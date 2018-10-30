'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

class Time {
    constructor(day, hour, minute, offset) {
        this.day = day;
        this.hour = hour;
        this.minute = minute;
        this.offset = offset;
    }

    getTimestamp(timezone) {
        return this.day * MINUTES_IN_DAY +
        this.hour * MINUTES_IN_HOUR +
        this.minute +
            (timezone - this.offset) * MINUTES_IN_HOUR;
    }

    getLocalTimeOfDay() {
        return this.hour * MINUTES_IN_HOUR + this.minute;
    }

    static parse(s) {
        let parts = s.split(' ');
        let day = 0;
        let timeStr;
        if (parts.length > 1) {
            day = getDayNumber(parts[0]);
            timeStr = parts[1];
        } else {
            timeStr = parts[0];
        }

        return Time.parseTime(day, timeStr);
    }

    static parseTime(day, s) {
        const match = s.match(/^(\d+):(\d+)\+(\d+)$/);

        let hour = Number(match[1]);
        let minute = Number(match[2]);
        let offset = Number(match[3]);

        return new Time(day, hour, minute, offset);
    }
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

    let bankTimeZone = Number(workingHours.from.split('+')[1]);

    let isSuitable = buildSchedule(schedule, workingHours, bankTimeZone);

    let endTime = getDayNumber('ЧТ') * MINUTES_IN_DAY;

    let appropriateMomemts = getAppropriateMinutes(isSuitable, duration, endTime);

    return {
        index: 0,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: () => appropriateMomemts.length > 0,

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
            let moment = appropriateMomemts[this.index];
            let day = Math.floor(moment / MINUTES_IN_DAY);
            moment %= MINUTES_IN_DAY;
            let hour = Math.floor(moment / MINUTES_IN_HOUR);
            moment %= MINUTES_IN_HOUR;

            return template
                .replace(/%HH/, hour.toString().padStart(2, '0'))
                .replace(/%MM/, moment.toString().padStart(2, '0'))
                .replace(/%DD/, days[day]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (this.index + 1 >= appropriateMomemts.length) {
                return false;
            }
            ++this.index;

            return true;
        }
    };
}

function getAppropriateMinutes(isSuitable, duration, endTime) {
    let freeMinutes = 0;
    let appropriateMomemts = [];

    for (let i = 0; i <= endTime; ++i) {
        if (!isSuitable(i)) {
            freeMinutes = 0;
            continue;
        }

        if (++freeMinutes < duration) {
            continue;
        }

        let previousTime = appropriateMomemts[appropriateMomemts.length - 1];
        let moment = i - duration + 1;
        if (previousTime !== undefined && moment - previousTime < 30) {
            continue;
        }

        appropriateMomemts.push(moment);
    }

    return appropriateMomemts;
}

function buildSchedule(rawSchedule, workingHours, bankTimeZone) {
    const busyTimes = Array.from(enumerateTimes(rawSchedule))
        .map(x => ({
            from: Time.parse(x.from).getTimestamp(bankTimeZone),
            to: Time.parse(x.to).getTimestamp(bankTimeZone)
        }));

    let openTime = Time.parse(workingHours.from).getLocalTimeOfDay();
    let closeTime = Time.parse(workingHours.to).getLocalTimeOfDay();

    return (time) => {
        let timeOfDay = time % MINUTES_IN_DAY;
        if (!(openTime <= timeOfDay && timeOfDay < closeTime)) {
            return false;
        }

        return busyTimes.every(x => !(x.from <= time && time < x.to));
    };
}

function *enumerateTimes(schedule) {
    for (let prop in schedule) {
        if (schedule.hasOwnProperty(prop)) {
            yield* schedule[prop];
        }
    }
}

function getDayNumber(day) {
    return days.indexOf(day);
}

module.exports = {
    getAppropriateMoment,

    isStar
};

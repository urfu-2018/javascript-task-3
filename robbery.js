'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const MINUTES_IN_DAY = 60 * 24;
const DAY_TO_MINUTES = { 'ПН': 0, 'ВТ': MINUTES_IN_DAY, 'СР': 2 * MINUTES_IN_DAY };
const DAYS = ['ПН', 'ВТ', 'СР'];

const TIME_RE = /^(\d{2}):(\d{2})\+(\d{1,2})$/;
const DATE_TIME_RE = /^(ПН|ВТ|СР) (\d{2}):(\d{2})\+(\d{1,2})$/;

function validateDate(date, parseDay) {
    if (parseDay && !DATE_TIME_RE.test(date) || !parseDay && !TIME_RE.test(date)) {
        throw new TypeError();
    }
}

function parseTimestamp(date, baseTz = null, parseDay = false) {
    validateDate(date, parseDay);

    if (!parseDay) {
        date = `ПН ${date}`;
    }

    const groups = DATE_TIME_RE.exec(date)
        .slice(1)
        .map((e, i) => i > 0 ? parseInt(e) : e);

    if (baseTz === null) {
        baseTz = groups[3];
    }

    const hours = baseTz - groups[3] + groups[1];
    const minutes = groups[2];

    return DAY_TO_MINUTES[groups[0]] + 60 * hours + minutes;
}

function extractDate(timestamp) {
    const day = DAYS[Math.floor(timestamp / MINUTES_IN_DAY)];
    timestamp %= MINUTES_IN_DAY;

    const hours = Math.floor(timestamp / 60);
    const minutes = timestamp % 60;

    return { day, hours, minutes };
}

class TimeSpan {
    constructor(left, right) {
        if (right < left) {
            throw new TypeError();
        }

        this._left = left;
        this._right = right;
    }

    get left() {
        return this._left;
    }

    get right() {
        return this._right;
    }

    get length() {
        return this.right - this.left;
    }

    static fromStrSpan(span, baseTz = null, parseDay = false) {
        return new TimeSpan(
            parseTimestamp(span.from, baseTz, parseDay),
            parseTimestamp(span.to, baseTz, parseDay)
        );
    }

    add(delta) {
        return new TimeSpan(this.left + delta, this.right + delta);
    }
}

function getBankIntervals(workingHours) {
    const result = [TimeSpan.fromStrSpan(workingHours)];

    for (let i = 1; i < 3; i++) {
        result.push(result[i - 1].add(MINUTES_IN_DAY));
    }

    return result;
}

function getGangMemberIntervals(schedule, baseTz) {
    const result = [];

    for (let span of schedule) {
        result.push(TimeSpan.fromStrSpan(span, baseTz, true));
    }

    return result;
}

function getIntersections(intervals1, intervals2) {
    const result = [];

    intervals1.forEach(int1 => {
        intervals2.forEach(int2 => {
            if (int1.right > int2.left && int1.left < int2.right) {
                result.push(new TimeSpan(
                    Math.max(int1.left, int2.left),
                    Math.min(int1.right, int2.right)
                ));
            }
        });
    });

    return result;
}

function getFreeTime(intervals) {
    const result = [];
    intervals.sort((u, v) => u.left - v.left);

    let left = 0;
    for (let interval of intervals) {
        result.push(new TimeSpan(left, interval.left));
        left = interval.right;
    }

    const endOfTime = MINUTES_IN_DAY * 3 - 1;
    if (left < endOfTime) {
        result.push(new TimeSpan(left, endOfTime));
    }

    return result;
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
    const baseTz = parseInt(workingHours.from.split('+')[1]);
    const bankIntervals = getBankIntervals(workingHours);
    const gangIntervals = Object.values(schedule)
        .map(s => getGangMemberIntervals(s, baseTz))
        .map(getFreeTime)
        .reduce(getIntersections);

    let suiteTimes = getIntersections(bankIntervals, gangIntervals)
        .filter(e => e.length >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return suiteTimes.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (suiteTimes.length === 0) {
                return '';
            }

            const suiteTime = extractDate(suiteTimes[0].left);

            return template
                .replace('%HH', suiteTime.hours.toString()
                    .padStart(2, '0'))
                .replace('%MM', suiteTime.minutes.toString()
                    .padStart(2, '0'))
                .replace('%DD', suiteTime.day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @param {number} delta - величина сдвига
         * @returns {Boolean}
         */
        tryLater: function (delta = 30) {
            if (suiteTimes.length === 0) {
                return false;
            }

            const suiteTime = suiteTimes[0];

            if (suiteTime.left + duration + delta <= suiteTime.right) {
                suiteTimes[0] = new TimeSpan(suiteTime.left + delta, suiteTime.right);

                return true;
            }

            if (suiteTimes.length > 1) {
                suiteTimes = suiteTimes.slice(1);

                return true;
            }

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

const TIME_RE = /^(\d{2}):(\d{2})\+(\d{1,2})$/;
const DATE_TIME_RE = /^(ПН|ВТ|СР) (\d{2}):(\d{2})\+(\d{1,2})$/;

const MINUTES_IN_DAY = 60 * 24;
const DAY_TO_MINUTES = { 'ПН': 0, 'ВТ': MINUTES_IN_DAY, 'СР': 2 * MINUTES_IN_DAY };

class Timestamp {
    static _validateDate(date, parseDay) {
        if (parseDay && !DATE_TIME_RE.test(date) || !parseDay && !TIME_RE.test(date)) {
            throw new TypeError();
        }
    }

    normalize() {
        if (this.minutes >= 60) {
            this.hours = (this.hours + Math.floor(this.minutes / 60)) % 24;
            this.minutes = this.minutes % 60;
        }
    }

    constructor(hours, minutes, value) {
        this.hours = hours;
        this.minutes = minutes;
        this.value = value;

        this.normalize();
    }

    static parse(date, baseTz = null, parseDay = false) {
        Timestamp._validateDate(date, parseDay);

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

        const value = DAY_TO_MINUTES[groups[0]] + 60 * hours + minutes;

        return new Timestamp(hours, minutes, value);
    }

    get day() {
        if (this.value < MINUTES_IN_DAY) {
            return 'ПН';
        } else if (this.value < 2 * MINUTES_IN_DAY) {
            return 'ВТ';
        }

        return 'СР';
    }

    _choose(other, predicate) {
        if (predicate()) {
            return this;
        }

        return other;
    }

    max(other) {
        return this._choose(other, () => this.value > other.value);
    }

    min(other) {
        return this._choose(other, () => this.value < other.value);
    }

    addMinutes(minutes) {
        return new Timestamp(this.hours, this.minutes + minutes, this.value + minutes);
    }

    addDay() {
        return new Timestamp(this.hours, this.minutes, this.value + 24 * 60);
    }
}


function getBankIntervals(workingHours) {
    const result = [[Timestamp.parse(workingHours.from), Timestamp.parse(workingHours.to)]];

    for (let i = 1; i < 3; i++) {
        result.push([result[i - 1][0].addDay(), result[i - 1][1].addDay()]);
    }

    return result;
}

function getGangMemberIntervals(schedule, baseTime) {
    const result = [];

    for (let span of schedule) {
        result.push([Timestamp.parse(span.from, baseTime, true),
            Timestamp.parse(span.to, baseTime, true)]);
    }

    return result;
}

function getIntersections(intervals1, intervals2) {
    const result = [];

    intervals1.forEach(int1 => {
        intervals2.forEach(int2 => {
            if (int1[1].value > int2[0].value && int1[0].value < int2[1].value) {
                result.push([int1[0].max(int2[0]), int1[1].min(int2[1])]);
            }
        });
    });

    return result;
}

function getFreeTime(intervals) {
    const result = [];
    intervals.sort((u, v) => u[0].value - v[0].value);

    let left = new Timestamp(0, 0, 0);
    for (let interval of intervals) {
        result.push([left, interval[0]]);
        left = interval[1];
    }
    result.push([left, new Timestamp(23, 59, MINUTES_IN_DAY * 3 - 1)]);

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
    const baseTime = parseInt(workingHours.from.split('+')[1]);
    const bankIntervals = getBankIntervals(workingHours);
    const gangIntervals = Object.values(schedule)
        .map(s => getGangMemberIntervals(s, baseTime))
        .map(getFreeTime)
        .reduce(getIntersections);

    let suiteTimes = getIntersections(bankIntervals, gangIntervals)
        .filter(e => e[1].value - e[0].value >= duration);

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

            const suiteTime = suiteTimes[0][0];

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

            if (suiteTime[0].value + duration + delta <= suiteTime[1].value) {
                suiteTimes[0][0] = suiteTime[0].addMinutes(delta);

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

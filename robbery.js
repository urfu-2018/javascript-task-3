'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

const WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

class WeekDay {
    constructor(weekDay) {
        this.day = weekDay;
        this.number = WEEK.indexOf(this.day);
    }

    addDays(daysCount) {
        this.number += daysCount;
        this.number %= 7;
        this.day = WEEK.indexOf(this.day);
    }
}

class TimeStamp {
    constructor(weekDay, hours, minutes, timeZone) {
        this.weekDay = weekDay ? new WeekDay(weekDay) : weekDay;
        this.hours = hours;
        this.minutes = minutes;
        this.timeZone = timeZone;
    }

    shift(timeShift) {
        this.timeZone += timeShift;
        this.hours += timeShift;
        if (this.hours >= 24 || this.hours < 0) {
            this.weekDay.addDays(this.hours < 0 ? -1 : 1);
            this.hours %= 24;
        }

        return this;
    }

    between(time1, time2) {
        return TimeStamp.compare(this, time1) >= 0 && TimeStamp.compare(this, time2) <= 0;
    }

    static compare(time1, time2) {
        let comparator = time1.weekDay.number - time2.weekDay.number;
        comparator = comparator !== 0 ? comparator : time1.hours - time2.hours;
        comparator = comparator !== 0 ? comparator : time1.minutes - time2.minutes;

        return comparator;
    }

    static max(time1, time2) {
        if (TimeStamp.compare(time1, time2) >= 0) {
            return time1;
        }

        return time2;
    }

    static min(time1, time2) {
        if (TimeStamp.compare(time1, time2) <= 0) {
            return time1;
        }

        return time2;
    }

    static parse(timeStamp) {
        const splitTimeStamp = timeStamp.split(/[ +:]/).reverse();

        return new TimeStamp(
            splitTimeStamp[3],
            parseInt(splitTimeStamp[2]),
            parseInt(splitTimeStamp[1]),
            parseInt(splitTimeStamp[0])
        );
    }
}

class TimeInterval {
    constructor(from, to) {
        if (!(from instanceof TimeStamp && to instanceof TimeStamp)) {
            throw new TypeError();
        }
        this.from = from;
        this.to = to;
    }

    shift(timeShift) {
        this.from.shift(timeShift);
        this.to.shift(timeShift);

        return this;
    }

    static areIntersected(time1, time2) {
        return time1.from.between(time2.from, time2.to) || time1.to.between(time2.from, time2.to) ||
            time2.from.between(time1.from, time1.to) || time2.to.between(time1.from, time1.to);
    }

    static parse(timeInterval) {
        return new TimeInterval(
            TimeStamp.parse(timeInterval.from),
            TimeStamp.parse(timeInterval.to)
        );
    }
}

class GangSchedule {
    constructor(schedule) {
        for (let robber in schedule) {
            if (schedule.hasOwnProperty(robber)) {
                this[robber] = schedule[robber];
            }
        }
    }

    forEachRobber(func, ...args) {
        for (let robber in this) {
            if (this.hasOwnProperty(robber)) {
                this[robber] = func(this[robber], ...args);
            }
        }
    }

    static parse(schedule) {
        const gangSchedule = {};
        for (const robber in schedule) {
            if (schedule.hasOwnProperty(robber)) {
                gangSchedule[robber] = schedule[robber].map(time => TimeInterval.parse(time));
            }
        }

        return new GangSchedule(gangSchedule);
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
    const bankSchedule = ['ПН', 'ВТ', 'СР'].map(day => new TimeInterval(
        TimeStamp.parse(`${day} ${workingHours.from}`),
        TimeStamp.parse(`${day} ${workingHours.to}`)
    ));
    const bankTimeZone = bankSchedule[0].from.timeZone;

    const gangSchedule = GangSchedule.parse(schedule);
    gangSchedule.forEachRobber(translateScheduleToTimeZone, bankTimeZone);
    gangSchedule.forEachRobber(findFreeTimeInPeriod, new TimeInterval(
        new TimeStamp('ПН', 0, 0, bankTimeZone),
        new TimeStamp('СР', 23, 59, bankTimeZone)
    ));

    let appropriateMoments = getAppropriateMoments(mergeSchedules(gangSchedule, bankSchedule));
    appropriateMoments = appropriateMoments
        .filter(moment => {
            const currentDuration = moment.to.hours * 60 + moment.to.minutes -
                (moment.from.hours * 60 + moment.from.minutes);

            return currentDuration >= duration;
        });

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return appropriateMoments.length !== 0;
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
            const start = appropriateMoments[0].from;

            template = template.replace(/%HH/, start.hours.toString().padStart(2, '0'))
                .replace(/%MM/, start.minutes.toString().padStart(2, '0'))
                .replace(/%DD/, start.weekDay.day);

            return template;
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

function translateScheduleToTimeZone(schedule, targetTimeZone) {
    const timeZone = schedule[0].from.timeZone;
    if (timeZone !== targetTimeZone) {
        const timeShift = targetTimeZone - timeZone;

        return schedule.map(timeInterval => timeInterval.shift(timeShift));
    }

    return schedule;
}

function findFreeTimeInPeriod(schedule, timePeriod) {
    schedule.sort((a, b) => TimeStamp.compare(a.from, b.from));
    const freeTimes = [];
    freeTimes.push({ from: timePeriod.from });
    schedule.forEach(timeInterval => {
        freeTimes[freeTimes.length - 1].to = timeInterval.from;
        freeTimes.push({ from: timeInterval.to });
    });
    freeTimes[freeTimes.length - 1].to = timePeriod.to;

    return freeTimes.map(interval => new TimeInterval(interval.from, interval.to));
}

function mergeSchedules(gangSchedule, bankSchedule) {
    return Object.keys(gangSchedule)
        .map(robber => gangSchedule[robber])
        .concat([bankSchedule]);
}

function getAppropriateMoments(schedule) {
    let moments = schedule[0];
    for (let i = 1; i < schedule.length; i++) {
        const currentMoments = [];
        const currentSchedule = schedule[i];
        for (let j = 0; j < currentSchedule.length; j++) {
            const timeInterval = currentSchedule[j];
            currentMoments.push(...trimByHours(moments, timeInterval));
        }
        moments = currentMoments;
    }

    return moments;
}

function trimByHours(schedule, hours) {
    const trimmedSchedule = [];
    schedule.forEach(timeInterval => {
        if (TimeInterval.areIntersected(timeInterval, hours)) {
            trimmedSchedule.push(new TimeInterval(
                TimeStamp.max(timeInterval.from, hours.from),
                TimeStamp.min(timeInterval.to, hours.to)
            ));
        }
    });

    return trimmedSchedule;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

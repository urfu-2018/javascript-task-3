'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

const DAYS = Object.freeze({
    'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6,
    parseDay: function (dayNumber) {
        const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

        return days[parseInt(dayNumber)];
    },
    addDays: function (day, daysCount) {
        return this.parseDay(this[day] + daysCount);
    }
});

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

    const bankWorkingHours = changeTimeSpan(parseTimestamp, workingHours);
    const bankTimeZone = bankWorkingHours.from.timeZone;
    const robbersSchedule = copyAndParseTimeSpan(schedule);
    forEachRobber(transferScheduleToTimeZone, robbersSchedule, bankTimeZone);
    forEachRobber(trimByDays, robbersSchedule);
    forEachRobber(trimByHours, robbersSchedule, bankWorkingHours);
    const appropriateTimes = getAppropriateTimes(robbersSchedule);
    const appropriateMoments = checkDuration(appropriateTimes, duration);

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
                .replace(/%DD/, start.weekDay);

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

function changeTimeSpan(changer, timeSpan) {
    const args = [];
    for (let i = 2; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    return {
        from: changer(timeSpan.from, args),
        to: changer(timeSpan.to, args)
    };
}

function forEachRobber(func, schedule) {
    const robbers = Object.keys(schedule);
    for (let i = 0; i < robbers.length; i++) {
        const robber = robbers[i];
        schedule[robber] = func(schedule[robber], arguments[2]);
    }
}

function parseTimestamp(timestamp) {
    const splitTimestamp = timestamp.split(/[ +:]/).reverse();

    return getTimestamp(
        splitTimestamp[3],
        parseInt(splitTimestamp[2]),
        parseInt(splitTimestamp[1]),
        parseInt(splitTimestamp[0])
    );
}

function getTimestamp(weekDay, hours, minutes, timeZone) {
    return {
        weekDay,
        hours,
        minutes,
        timeZone
    };
}

function copyAndParseTimeSpan(schedule) {
    const robbers = Object.keys(schedule);
    const newSchedule = {};
    for (let i = 0; i < robbers.length; i++) {
        const robber = robbers[i];
        Object.defineProperty(newSchedule, robber, {
            value: [],
            configurable: false,
            writable: true,
            enumerable: true
        });
        for (let j = 0; j < schedule[robber].length; j++) {
            newSchedule[robber].push(changeTimeSpan(parseTimestamp, schedule[robber][j]));
        }
    }

    return newSchedule;
}

function transferScheduleToTimeZone(robberSchedule, targetTimeZone) {
    targetTimeZone = parseInt(targetTimeZone);
    const timeZone = robberSchedule[0].from.timeZone;
    if (timeZone !== targetTimeZone) {
        const timeShift = targetTimeZone - timeZone;

        return robberSchedule.map(
            timeSpan => changeTimeSpan(shiftTimestamp, timeSpan, timeShift));
    }

    return robberSchedule;
}

function shiftTimestamp(timestamp, timeShift) {
    timeShift = parseInt(timeShift);
    timestamp.timeZone += timeShift;
    timestamp.hours += timeShift;
    if (timestamp.hours >= 24 || timestamp.hours < 0) {
        timestamp.weekDay = DAYS.addDays(timestamp.weekDay, timestamp.hours < 0 ? -1 : 1);
        timestamp.hours %= 24;
    }

    return timestamp;
}

function trimByDays(robberSchedule) {
    const newSchedule = [];
    for (let j = 0; j < robberSchedule.length; j++) {
        const timeSpan = robberSchedule[j];
        if (timeSpan.from.weekDay === timeSpan.to.weekDay) {
            newSchedule.push(timeSpan);
        } else {
            newSchedule.push({
                from: timeSpan.from,
                to: getTimestamp(
                    timeSpan.from.weekDay,
                    23, 59,
                    timeSpan.from.timeZone
                )
            });
            newSchedule.push({
                from: getTimestamp(
                    timeSpan.to.weekDay,
                    0, 0,
                    timeSpan.to.timeZone
                ),
                to: timeSpan.to
            });
        }
    }

    return newSchedule;
}

function trimByHours(robberSchedule, trimmerHours) {
    const newSchedule = [];
    for (let i = 0; i < robberSchedule.length; i++) {
        const timeSpan = robberSchedule[i];
        if (trimmerHours.from.weekDay && trimmerHours.from.weekDay !== timeSpan.from.weekDay) {
            newSchedule.push(timeSpan);
            continue;
        }
        const trimTimeSpan = getTrimTimeSpan(timeSpan, trimmerHours);
        if (compareTime(trimTimeSpan.from, trimTimeSpan.to) !== 1) {
            newSchedule.push(trimTimeSpan);
        }
    }

    return newSchedule;
}

function compareTime(time1, time2) {
    if (time1.hours < time2.hours) {
        return -1;
    } else if (time1.hours === time2.hours && time1.minutes === time2.minutes) {
        return 0;
    }

    return 1;
}

function getTrimTimeSpan(timeSpan, trimmerHours) {
    return {
        from: getTimestamp(
            timeSpan.from.weekDay,
            Math.max(timeSpan.from.hours, trimmerHours.from.hours),
            timeSpan.from.hours < trimmerHours.from.hours
                ? trimmerHours.from.minutes
                : timeSpan.from.minutes,
            timeSpan.from.timeZone
        ),
        to: getTimestamp(
            timeSpan.to.weekDay,
            Math.min(timeSpan.to.hours, trimmerHours.to.hours),
            timeSpan.to.hours < trimmerHours.to.hours
                ? timeSpan.to.minutes
                : trimmerHours.to.minutes,
            timeSpan.to.timeZone
        )
    };
}

function getAppropriateTimes(schedule) {
    const robbers = Object.keys(schedule);
    let appropriateTimes = schedule[robbers[0]];
    for (let i = 1; i < robbers.length; i++) {
        const robber = robbers[i];
        for (let j = 0; j < schedule[robber].length; j++) {
            const trimmerTimeSpan = schedule[robber][j];
            appropriateTimes = trimByHours(appropriateTimes, trimmerTimeSpan);
        }
    }

    return appropriateTimes;
}

function checkDuration(moments, targetDuration) {
    const appropriateMoments = [];
    for (let i = 0; i < moments.length; i++) {
        const moment = moments[i];
        const duration = moment.to.hours * 60 + moment.to.minutes -
            (moment.from.hours * 60 + moment.from.minutes);
        if (duration >= targetDuration) {
            appropriateMoments.push(moment);
        }
    }

    return appropriateMoments;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

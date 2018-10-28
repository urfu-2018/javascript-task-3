'use strict';
const days = ['ПН', 'ВТ', 'СР'];
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var intervalsForRobbery = getRobberyIntervals(schedule, workingHours, duration);
    var timeForRobbery = intervalsForRobbery.length
        ? intervalsForRobbery[0].periodStart : undefined;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return timeForRobbery !== undefined;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }
            const date = minutesToDate(timeForRobbery);

            return template.replace('%HH', addLeadingZero(date.hours))
                .replace('%MM', addLeadingZero(date.remainingMinutes))
                .replace('%DD', date.day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            intervalsForRobbery = intervalsForRobbery.filter(function (interval) {
                return Math.max(timeForRobbery + 30, interval.periodStart) + duration <=
                    interval.periodStart + interval.size;
            });

            if (!intervalsForRobbery.length) {
                return false;
            }
            timeForRobbery = Math.max(intervalsForRobbery[0].periodStart, timeForRobbery + 30);

            return true;
        }
    };
};

function getRobberyIntervals(schedule, workingHours, duration) {
    const bankTimezone = extractDateComponents(workingHours.from).timezone;
    const notWorkingHoursOfBank = getNotWorkingHours(workingHours, bankTimezone);
    const unitedSchedule = Object.assign({ bank: notWorkingHoursOfBank }, schedule);
    const formattedSchedule = formatSchedule(unitedSchedule, bankTimezone);
    const intervals = getIntervalsOfFreeTime(formattedSchedule);

    return intervals.filter((interval) => interval.size >= duration);
}

function formatSchedule(schedule, bankTimezone) {
    var parsedSchedule = [];
    const allSchedules = schedule.Danny.concat(schedule.bank, schedule.Rusty, schedule.Linus);
    allSchedules.forEach(function (record) {
        const startDate = extractDateComponents(record.from);
        const endDate = extractDateComponents(record.to);
        const startDateInMinutes = dateToMinutes(startDate, bankTimezone);
        const endDateInMinutes = dateToMinutes(endDate, bankTimezone);
        parsedSchedule.push({ minutes: startDateInMinutes, mark: 'start' },
            { minutes: endDateInMinutes, mark: 'finish' });
    });

    return parsedSchedule;
}

function addLeadingZero(number) {
    return `0${number}`.slice(-2);
}

function minutesToDate(minutes) {
    const hours = Math.floor(minutes / MINUTES_IN_HOUR) % HOURS_IN_DAY;
    const day = days[Math.floor(Math.floor(minutes / MINUTES_IN_HOUR) / HOURS_IN_DAY)];
    const remainingMinutes = minutes % MINUTES_IN_HOUR;
    if (!day) {
        return null;
    }

    return { day, hours, remainingMinutes };
}

function getNotWorkingHours(workingHours, bankTimezone) {
    return days.reduce(function (accumulator, day) {
        accumulator.push(
            {
                from: day + ' 00:00+' + bankTimezone,
                to: day + ' ' + workingHours.from
            },
            {
                from: day + ' ' + workingHours.to,
                to: day + ' 23:59+' + bankTimezone
            });

        return accumulator;
    }, []);
}

function extractDateComponents(date) {
    const [time, day] = date.split(' ').reverse();
    const [hoursAndMinutes, timezone] = time.split('+');
    const [hours, minutes] = hoursAndMinutes.split(':');

    return { day, hours, minutes, timezone };
}

function dateToMinutes(time, bankTimezone) {
    const day = time.day;
    const hours = Number(time.hours);
    const minutes = Number(time.minutes);
    const robberTimezone = Number(time.timezone);

    return hours * MINUTES_IN_HOUR + minutes + days.indexOf(day) *
        HOURS_IN_DAY * MINUTES_IN_HOUR + (bankTimezone - robberTimezone) * MINUTES_IN_HOUR;
}

function getIntervalsOfFreeTime(formattedSchedule) {
    var intervalLength = 0;
    const sortedSchedule = formattedSchedule.sort((a, b) => Number(a.minutes) - Number(b.minutes));
    var startMarksCounter = 0;
    var endMarkCounter = 0;
    var currentStartMinutes;
    var previousEndMinutes = 0;

    return sortedSchedule.reduce(function (intervals, event) {
        if (!startMarksCounter) {
            currentStartMinutes = event.minutes;
        }
        if (event.mark === 'start') {
            startMarksCounter += 1;
        } else {
            endMarkCounter += 1;
        }
        if (startMarksCounter === endMarkCounter) {
            startMarksCounter = 0;
            endMarkCounter = 0;
            intervalLength = currentStartMinutes - previousEndMinutes;
            intervals.push({ periodStart: previousEndMinutes, size: intervalLength });
            previousEndMinutes = event.minutes;
        }

        return intervals;
    }, []);
}

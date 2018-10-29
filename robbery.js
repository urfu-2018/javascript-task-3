'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const days = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const dayFromNumber = { 0: 'ПН', 1: 'ВТ', 2: 'СР', 3: 'ЧТ', 4: 'ПТ', 5: 'СБ', 6: 'ВС' };
const weekRegex = /^([а-яА-ЯёЁ]{2}) (\d{2}):(\d{2})\+(\d+)$/;
const dayRegex = /^(\d{2}):(\d{2})\+(\d+)$/;
const hoursInDay = 24;
const minutesInHour = 60;
const minutesInDay = hoursInDay * minutesInHour;
const lastAppropriateMoment = days['ЧТ'] * minutesInDay - 1;

function getMinutesFromWeekStarts(splitedDate) {
    let minutesFromWeekStarts = 0;
    minutesFromWeekStarts += days[splitedDate[1].toUpperCase()] * minutesInDay;
    minutesFromWeekStarts += (Number(splitedDate[2]) - Number(splitedDate[4])) * minutesInHour;
    minutesFromWeekStarts += Number(splitedDate[3]);

    return minutesFromWeekStarts;
}

function getMinutesFromDayStarts(splitedDate) {
    let minutesFromDayStarts = 0;
    minutesFromDayStarts += (Number(splitedDate[1]) - Number(splitedDate[3])) * minutesInHour;
    minutesFromDayStarts += Number(splitedDate[2]);

    return minutesFromDayStarts;
}

function getIntervalObject(from, to) {
    return { from, to };
}

function toMinutesFromWeekStarts(schedule) {
    return Object.values(schedule).map(robber =>
        robber
            .map(time => getIntervalObject(
                weekRegex.exec(time.from),
                weekRegex.exec(time.to)))
            .map(splited => getIntervalObject((getMinutesFromWeekStarts(splited.from)),
                (getMinutesFromWeekStarts(splited.to))))
            .sort((first, second) => first.from > second.from));
}

function getFreeTimeIntervals(schedule) {
    let freeTimeIntervals = [];
    let times = [];
    schedule.forEach(robber => {
        robber.forEach(interval => {
            times.push({ from: true, value: interval.from });
            times.push({ from: false, value: interval.to });
        });
    });
    times = times.sort(function (first, second) {
        return first.value - second.value;
    });
    let left = 0;
    let busyNumber = 0;
    times.forEach(time => {
        if (busyNumber === 0) {
            freeTimeIntervals.push({ from: left, to: time.value });
        }
        if (time.from) {
            busyNumber += 1;
        } else {
            left = time.value;
            busyNumber -= 1;
        }
    });
    freeTimeIntervals.push({ from: left, to: lastAppropriateMoment });

    return freeTimeIntervals;
}

function getDateFromMinutes(minutesFromWeekStarts, bankTimezone = 0) {
    minutesFromWeekStarts += bankTimezone * minutesInHour;
    const dayNumber = Math.floor(minutesFromWeekStarts / minutesInDay);
    const day = dayFromNumber[dayNumber];
    let hours = Math.floor(minutesFromWeekStarts % minutesInDay / minutesInHour);
    let minutes = minutesFromWeekStarts - dayNumber * minutesInDay - hours * minutesInHour;

    hours = String(hours).length === 1 ? '0' + hours : hours;
    minutes = String(minutes).length === 1 ? '0' + minutes : minutes;

    return { day, hours, minutes };
}

function getIntervalObjectsForWeek(workingHoursInterval) {
    let result = [];
    Object.values(days).map(dayNumber =>
        result.push({
            from: workingHoursInterval.from + dayNumber * minutesInDay,
            to: workingHoursInterval.to + dayNumber * minutesInDay
        }));

    return result;
}

function haveIntersection(firstInterval, secondInterval) {
    return firstInterval.from <= secondInterval.to && firstInterval.to >= secondInterval.from ||
    secondInterval.from <= firstInterval.to && secondInterval.to >= firstInterval.from;
}

function getPossibleIntervals(schedule, workingHours) {
    let possibleIntervals = [];

    workingHours.forEach(bankInterval => {
        schedule.forEach(robberInterval => {
            if (bankInterval.to <= lastAppropriateMoment &&
                    haveIntersection(bankInterval, robberInterval)) {
                possibleIntervals.push({
                    from: Math.max(bankInterval.from, robberInterval.from),
                    to: Math.min(bankInterval.to, robberInterval.to)
                });
            }
        });
    });

    return possibleIntervals;
}

function getIntervalsWithDuration(intervals, duration) {
    return intervals
        .filter(interval => interval.to - duration >= interval.from)
        .sort((first, second) => first.from > second.from);
}

function getIntervalsWithShifts(intervals, duration) {
    let intervalsWithPossibleShifts = [];
    const delay = 30;
    let left = intervals[0].from;
    let counter = 0;

    while (counter < intervals.length && left < lastAppropriateMoment - duration) {
        if (left >= intervals[counter].from &&
            left + duration <= intervals[counter].to) {
            intervalsWithPossibleShifts.push({
                from: left,
                to: intervals[counter].to
            });
        }
        left += delay;
        counter = left > intervals[counter].to ? counter + 1 : counter;
    }

    return intervalsWithPossibleShifts;
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
    const formatedSchedule = toMinutesFromWeekStarts(schedule);
    const freeTimeIntervals = getFreeTimeIntervals(formatedSchedule);
    const workingHoursInterval = {
        from: getMinutesFromDayStarts(dayRegex.exec(workingHours.from)),
        to: getMinutesFromDayStarts(dayRegex.exec(workingHours.to)) };
    const formatedWorkingHours = getIntervalObjectsForWeek(workingHoursInterval);
    const possibleIntervals = getPossibleIntervals(freeTimeIntervals, formatedWorkingHours);
    const validIntervals = getIntervalsWithDuration(possibleIntervals, duration);
    let validIntervalsWithShifts =
        validIntervals.length > 0 ? getIntervalsWithShifts(validIntervals, duration) : [];

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return validIntervalsWithShifts.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (validIntervalsWithShifts.length === 0) {
                return '';
            }
            const bankTimezone = dayRegex.exec(workingHours.from)[3];
            const date = getDateFromMinutes(validIntervalsWithShifts[0].from,
                bankTimezone);

            template = template.replace('%DD', date.day);
            template = template.replace('%HH', date.hours);
            template = template.replace('%MM', date.minutes);

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (validIntervalsWithShifts.length > 1) {
                validIntervalsWithShifts.shift();

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

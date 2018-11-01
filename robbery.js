'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const weekdays = ['ПН', 'ВТ', 'СР'];
const hoursInDay = 24;
const minutesInHour = 60;
const minutesInDay = 24 * 60;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    let bankTime = parseInt(workingHours.from.slice(6));
    let dannyFreeTime = invertIntervals(scheduleToIntervals(schedule.Danny, bankTime));
    let linusFreeTime = invertIntervals(scheduleToIntervals(schedule.Linus, bankTime));
    let rustyFreeTime = invertIntervals(scheduleToIntervals(schedule.Rusty, bankTime));

    let bankSchedule = scheduleToIntervals(workingHoursToSchedule(workingHours), bankTime);
    let timesWhenAllFree = intersectSchedules(dannyFreeTime, linusFreeTime);
    timesWhenAllFree = intersectSchedules(timesWhenAllFree, rustyFreeTime);
    timesWhenAllFree = intersectSchedules(timesWhenAllFree, bankSchedule);
    let goodTimes = timesWhenAllFree.filter(x => x[1] - x[0] >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return goodTimes.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (goodTimes.length === 0) {
                return '';
            }
            const startTime = goodTimes[0][0];
            const weekdayIndex = Math.floor(startTime / minutesInDay);
            const weekday = weekdays[weekdayIndex];
            const hour = (Math.floor((startTime - minutesInDay * weekdayIndex) /
                minutesInHour)).toString();
            let paddedHour=hour.padStart(2, '0');
            const minute = (startTime % minutesInHour).toString();
            let paddedMinute = minute.length === 1 ? '0' + minute : minute;
            const replacementDict = {
                '%HH': paddedHour,
                '%DD': weekday,
                '%MM': paddedMinute
            };

            return template.replace(/%HH|%MM|%DD/gi, templateItem => replacementDict[templateItem]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (goodTimes.length === 0) {
                return false;
            }
            if (goodTimes[0][1] - goodTimes[0][0] >= duration + 30) {
                goodTimes[0][0] += 30;

                return true;
            }
            if (goodTimes.length > 1) {
                goodTimes.shift();

                return true;
            }

            return false;
        }
    };
}

function convertToMinutesInBankTime(timestring, bankTime) {
    let day = timestring.slice(0, 2);
    let hours = parseInt(timestring.slice(3, 5)) - parseInt(timestring.slice(9)) + bankTime;
    let minutes = parseInt(timestring.slice(6, 8));

    return (weekdays.indexOf(day) * hoursInDay + hours) * minutesInHour + minutes;
}

function scheduleToIntervals(schedule, bankTime) {
    return schedule.map(scheduleItem =>
        [convertToMinutesInBankTime(scheduleItem.from, bankTime),
            convertToMinutesInBankTime(scheduleItem.to, bankTime)]
    );
}

function intersectSchedules(firstSchedule, secondSchedule) {
    firstSchedule.sort((a, b) => a[0] - b[0]);
    secondSchedule.sort((a, b) => a[0] - b[0]);

    const intersection = [];

    firstSchedule.forEach(first => {
        secondSchedule.forEach(second => {
            if (first[1] > second[0] && first[0] < second[1]) {
                intersection.push([Math.max(first[0], second[0]), Math.min(first[1], second[1])]);
            }
        });
    });

    return intersection;
}

function workingHoursToSchedule(workingHours) {
    return weekdays.map(weekday => {
        return { from: weekday + ' ' + workingHours.from, to: weekday + ' ' + workingHours.to };
    });
}

function invertIntervals(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    const max = 3 * minutesInDay - 1;
    let rightBorder = 0;
    const newIntervals = [];
    intervals.forEach(interval => {
        newIntervals.push([rightBorder, interval[0]]);
        rightBorder = interval[1];
    });
    newIntervals.push([rightBorder, max]);

    return newIntervals;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

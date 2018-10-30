'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const weekdays = ['ПН', 'ВТ', 'СР'];

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
            let startTime = goodTimes[0][0];
            const weekdayIndex = Math.floor(startTime / (24 * 60));
            const weekday = weekdays[weekdayIndex];
            const hour = (Math.floor((startTime - 24 * 60 * weekdayIndex) /
                60)).toString();
            let paddedHour = hour.length === 1 ? '0' + hour : hour;
            const minute = (startTime % 60).toString();
            let paddedMinute = minute.length === 1 ? '0' + minute : minute;
            const replacementDict = {
                '%HH': paddedHour, '%DD': weekday,
                '%MM': paddedMinute
            };

            return template.replace(/%HH|%MM|%DD/gi, m => replacementDict[m]);
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

    return (weekdays.indexOf(day) * 24 + hours) * 60 + minutes;
}

function scheduleToIntervals(schedule, bankTime) {
    return schedule.map(x =>
        [convertToMinutesInBankTime(x.from, bankTime),
            convertToMinutesInBankTime(x.to, bankTime)]
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
    let prefixes = ['ПН ', 'ВТ ', 'СР '];

    return prefixes.map(x => {
        return { from: x + workingHours.from, to: x + workingHours.to };
    });

}


function invertIntervals(intervals) {
    intervals.sort((a, b)=>a[0] - b[0]);
    const max = 72 * 60 - 1;
    let rightBorder = 0;
    const newIntervals = [];
    intervals.forEach(x => {
        newIntervals.push([rightBorder, x[0]]);
        rightBorder = x[1];
    });
    newIntervals.push([rightBorder, max]);

    return newIntervals;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

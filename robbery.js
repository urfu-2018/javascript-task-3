'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const minutesFromStart = {
    'ПН': 0,
    'ВТ': 1,
    'СР': 2,
    'ЧТ': 3
};
const minutesInDay = 1440;
let intersections = [];

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    intersections = formatBankWorkingHours(workingHours);
    const bankTimezone = workingHours.from.split('+')[1];

    for (const member of Object.keys(schedule)) {
        for (const daySchedule of schedule[member]) {
            const memberTimezone = Number(daySchedule.from.split('+')[1]);
            const timezoneDiff = (bankTimezone - memberTimezone) * 60;
            const workingDay = {
                from: calculateInMinutes(daySchedule.from, timezoneDiff),
                to: calculateInMinutes(daySchedule.to, timezoneDiff)
            };

            findIntersections(workingDay);
        }
    }

    removeShortIntersections(duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return !isEmpty(intersections);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (this.exists()) {
                let startMinute = intersections[0].from;
                let dayOfTheWeek = ['ПН', 'ВТ', 'СР'];
                let hours = Math.trunc(startMinute / 60) % 24;
                if (hours < 10) {
                    hours = '0' + hours;
                }
                let minutes = startMinute % 60;
                if (minutes < 10) {
                    minutes = '0' + minutes;
                }
                const day = dayOfTheWeek[Math.trunc(startMinute / 1440)];

                return template.replace(/%DD/, day)
                    .replace(/%HH/, hours)
                    .replace(/%MM/, minutes);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const delay = 30;
            if (this.exists()) {
                const interval = intersections[0];
                const timeForRobbery = interval.to - interval.from;
                // Если времени достаточно
                if (timeForRobbery - delay >= duration) {
                    intersections[0].from += 30;

                    return true;
                }
                // Если есть другой интервал
                if (intersections.length > 1) {
                    intersections.shift();

                    return true;
                }
            }

            return false;
        }
    };
}

function formatBankWorkingHours(workingHours) {
    const [hoursFrom, minutesFrom] = workingHours.from
        .match(/(\d{2}):(\d{2})/)
        .slice(1)
        .map(Number);

    const [hoursTo, minutesTo] = workingHours.to
        .match(/(\d{2}):(\d{2})/)
        .slice(1)
        .map(Number);

    return [
        { from: hoursFrom * 60 + minutesFrom, to: hoursTo * 60 + minutesTo },
        { from: hoursFrom * 60 + minutesFrom + 1440, to: hoursTo * 60 + minutesTo + 1440 },
        { from: hoursFrom * 60 + minutesFrom + 2880, to: hoursTo * 60 + minutesTo + 2880 }
    ];
}

function calculateInMinutes(time, timezoneDiff) {
    const timeParts = time.split(/\s|:|\+/);
    const dayOfTheWeek = timeParts[0];
    const hours = Number(timeParts[1]);
    const minutes = Number(timeParts[2]);

    if (!Object.keys(minutesFromStart).includes(dayOfTheWeek)) {
        return Infinity;
    }

    return hours * 60 + minutes + timezoneDiff + minutesFromStart[dayOfTheWeek] * minutesInDay;
}

function findIntersections(daySchedule) {
    let clone = intersections.slice();
    for (const interval of clone) {
        intersect(interval, daySchedule);
    }
}

function intersect(interval, daySchedule) {
    if (daySchedule.from >= interval.to || daySchedule.to <= interval.from) {
        return;
    }
    updateIntersections(interval, daySchedule);
}

function updateIntersections(interval, daySchedule) {
    const index = intersections.indexOf(interval);
    if (daySchedule.from > interval.from) {
        if (daySchedule.to < interval.to) {
            const firstInterval = { from: interval.from, to: daySchedule.from };
            const secondInterval = { from: daySchedule.to, to: interval.to };
            intersections.splice(index, 1, firstInterval, secondInterval);
        }
        if (daySchedule.to >= interval.to) {
            intersections.splice(index, 1, { from: interval.from, to: daySchedule.from });
        }
    }
    if (daySchedule.from <= interval.from && daySchedule.to < interval.to) {
        intersections.splice(index, 1, { from: daySchedule.to, to: interval.to });
    }
}

function removeShortIntersections(duration) {
    intersections = intersections.filter(interval => interval.to - interval.from >= duration);
}

function isEmpty(array) {
    return array.length === 0;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

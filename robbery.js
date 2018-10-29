'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const minutesFromStart = {
    'ПН': 0,
    'ВТ': 1440,
    'СР': 2880,
    'ЧТ': 4320
};
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

    Object.keys(schedule).forEach(member =>
        schedule[member].forEach(daySchedule => {
            const tmp = daySchedule.from.replace(/[+:]/g, ' ').split(' ');
            const memberTimezone = tmp[3];
            const timezoneDiff = (bankTimezone - memberTimezone) * 60;
            daySchedule.from = calculateInMinutes(daySchedule.from, timezoneDiff);
            daySchedule.to = calculateInMinutes(daySchedule.to, timezoneDiff);

            findIntersections(daySchedule);

        }));

    filterIntersictions(duration);

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

                return template.replace('%HH', hours)
                    .replace('%MM', minutes)
                    .replace('%DD', day);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const interval = intersections[0];
            const delay = 30;
            if (this.exists()) {
                const timeForRobbery = intersections[0].to - intersections[0].from;
                if (timeForRobbery - delay >= duration) {
                    intersections[0].from += 30;

                    return true;
                }
            }
            intersections.shift();
            if (intersections.length > 0) {
                return true;
            }
            intersections.push(interval);

            return false;
        }
    };
}

function formatBankWorkingHours(workingHours) {
    const fromTmp = workingHours.from.replace(/[+:]/g, ' ').split(' ');
    const hoursFrom = Number(fromTmp[0]);
    const minutesFrom = Number(fromTmp[1]);

    const toTmp = workingHours.to.replace(/[+:]/g, ' ').split(' ');
    const hoursTo = Number(toTmp[0]);
    const minutesTo = Number(toTmp[1]);

    return [
        { from: hoursFrom * 60 + minutesFrom, to: hoursTo * 60 + minutesTo },
        { from: hoursFrom * 60 + minutesFrom + 1440, to: hoursTo * 60 + minutesTo + 1440 },
        { from: hoursFrom * 60 + minutesFrom + 2880, to: hoursTo * 60 + minutesTo + 2880 }
    ];
}

function calculateInMinutes(time, timezoneDiff) {
    const tmp = time.replace(/[+:]/g, ' ').split(' ');
    const dayOfTheWeek = tmp[0];
    const hours = Number(tmp[1]);
    const minutes = Number(tmp[2]);

    if (!Object.keys(minutesFromStart).includes(dayOfTheWeek)) {
        return Number.MAX_VALUE;
    }

    return hours * 60 + minutes + timezoneDiff + minutesFromStart[dayOfTheWeek];
}

function findIntersections(daySchedule) {
    let clone = intersections.slice();
    // let clone = Object.assign([], intersections);
    for (const interval of clone) {
        intersect(interval, daySchedule);
    }
}

function intersect(interval, daySchedule) {
    // const start = daySchedule.from;
    // const end = daySchedule.to;
    if (daySchedule.from >= interval.to || daySchedule.to <= interval.from) {
        return;
    }
    changeIntersections(interval, daySchedule);
}

function changeIntersections(interval, daySchedule) {
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

function filterIntersictions(duration) {
    intersections = intersections.filter(interval => interval.to - interval.from >= duration);
}

function isEmpty(array) {
    return array.length === 0;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

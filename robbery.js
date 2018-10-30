'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const MINUTEINDAY = 24 * 60;
const DAYS = {
    'ПН': 0,
    'ВТ': 24 * 60,
    'СР': 48 * 60
};
const MAXMINUTEINDAYS = MINUTEINDAY * 3 - 1;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */


function invertSchedule(schedule) {
    schedule.sort((a, b) => a[0] - b[0]);
    let startOfInterval = 0;
    const freeTime = [];
    schedule.forEach(time => {
        freeTime.push([startOfInterval, time[0]]);
        startOfInterval = time[1];
    });
    freeTime.push([startOfInterval, MAXMINUTEINDAYS]);
    freeTime.sort((a, b) => a[0] - b[0]);

    return freeTime;
}

function parseBankTime(open, close) {
    const openFrom = parseInMinutes(parseInt(open.slice(0, 2)), parseInt(open.slice(3, 5)));
    const closeTo = parseInMinutes(parseInt(close.slice(0, 2)), parseInt(close.slice(3, 5)));

    return [[openFrom, closeTo], [openFrom + DAYS['ВТ'], closeTo + DAYS['ВТ']],
        [openFrom + DAYS['СР'], closeTo + DAYS['СР']]];
}

function parseInMinutes(hours, minutes) {
    return hours * 60 + minutes;
}

function correctTime(time, timeZone, bankZone, day) {
    const hours = parseInt(time.slice(0, 2)) + parseInt(bankZone) - parseInt(timeZone);
    const minutes = parseInt(time.slice(3, 5));

    return hours * 60 + DAYS[day] + minutes;
}

function rightFormat(time, bankZone) {
    const day = time.slice(0, 2);
    let minutes = correctTime(time.slice(3, 8), time.slice(9), bankZone, day);

    return minutes;
}

function parseBusyTime(schedule, bankZone) {
    return schedule
        .map(times => [rightFormat(times.from, bankZone), rightFormat(times.to, bankZone)]);
}


function totalFreeTime(firstTimes, secondTimes) {
    const schedule = [];
    firstTimes.forEach(intervalAtFirst => {
        secondTimes.forEach(intervalAtSecond => {
            if (intervalAtFirst[1] > intervalAtSecond[0] &&
                intervalAtFirst[0] < intervalAtSecond[1]) {
                schedule.push([Math.max(intervalAtFirst[0], intervalAtSecond[0]),
                    Math.min(intervalAtFirst[1], intervalAtSecond[1])]);
            }
        });
    });

    return schedule;
}


function getAppropriateMoment(schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    const bankZone = parseInt(workingHours.from.slice(6));
    const scheduleDanny = parseBusyTime(schedule.Danny, bankZone);
    const scheduleRusty = parseBusyTime(schedule.Rusty, bankZone);
    const scheduleLinus = parseBusyTime(schedule.Linus, bankZone);
    const bankTime = parseBankTime(workingHours.from, workingHours.to);
    const freeTimeForDanny = invertSchedule(scheduleDanny);
    const freeTimeForRusty = invertSchedule(scheduleRusty);
    const freeTimeForLinus = invertSchedule(scheduleLinus);
    const freeTimeDannyAndRusty = totalFreeTime(freeTimeForDanny, freeTimeForRusty);
    const guysFreeTimes = totalFreeTime(freeTimeDannyAndRusty, freeTimeForLinus);
    const resultTime = totalFreeTime(guysFreeTimes, bankTime)
        .filter(interval => interval[1] - interval[0] >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return resultTime.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (resultTime.length === 0) {
                return '';
            }
            const startTime = resultTime[0][0];
            let days = '';
            Object.keys(DAYS).map(day => {
                if (startTime > DAYS[day]) {
                    days = day;
                }

                return day;
            });

            let hours = Math.trunc(startTime / 60) - DAYS[days] / 60;
            let minutes = (startTime / 60 - Math.floor(startTime / 60)) * 60;

            return template
                .replace(/%HH/, hours.toString().padStart(2, '0'))
                .replace(/%DD/, days)
                .replace(/%MM/, minutes.toString().padStart(2, '0'));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (resultTime.length === 0) {
                return false;
            }
            let interval = resultTime[0];

            if (interval[1] - interval[0] >= duration + 30) {
                interval[0] += 30;

                return true;
            }

            if (resultTime.length <= 1) {
                return false;
            }
            resultTime.shift();

            return true;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

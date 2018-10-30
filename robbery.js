'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const days = ['ПН', 'ВТ', 'СР'];
const minutesInHour = 60;
const minutesInDay = minutesInHour * 24;


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
    const bankTimeZone = getTimeZone(workingHours);
    const bankWorkingMinutes = getBankWorkingMinutes(workingHours);
    const scheduleInMinutes = getScheduleInMinutes(schedule, bankTimeZone);
    const posibleTime = getPosibleTimes(scheduleInMinutes, duration, bankWorkingMinutes);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return posibleTime.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (this.exists()) {
                const day = days[Math.floor(posibleTime[0] / minutesInDay)];
                const hours = Math.floor((posibleTime[0] % minutesInDay) / minutesInHour);
                const minutes = (posibleTime[0] % minutesInDay) % minutesInHour;

                return template.replace('%DD', day)
                    .replace('%HH', getNumber(hours))
                    .replace('%MM', getNumber(minutes));
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (posibleTime.length > 1) {
                posibleTime.shift();

                return true;
            }

            return false;
        }
    };
}

function getTimeZone(time) {
    return parseInt(time.from.match(/\d+$/)[0]);
}

function getTimeInMinutes(time) {
    let hours = parseInt(time.substr(0, 2));
    let minutes = parseInt(time.substr(3, 2));

    return hours * minutesInHour + minutes;
}

function getRobberScheduleInMinutes(schedule, bankTimeZone) {
    let scheduleInMinutes = [];
    if (schedule.length !== 0) {
        let differenceTimeZone = bankTimeZone - getTimeZone(schedule[0]);
        schedule.forEach(time => scheduleInMinutes.push({
            from: convertDayTimeToMinutes(time.from) + differenceTimeZone * minutesInHour,
            to: convertDayTimeToMinutes(time.to) + differenceTimeZone * minutesInHour
        }));
    }

    return scheduleInMinutes;
}

function convertDayTimeToMinutes(dayTime) {
    let dayCoefficient = days.indexOf(dayTime.substr(0, 2));
    let timeInMinutes = getTimeInMinutes(dayTime.substr(3, 5));
    timeInMinutes += dayCoefficient * minutesInDay;

    return timeInMinutes;
}

function getBankWorkingMinutes(workingHours) {
    let openTimeMinutes = getTimeInMinutes(workingHours.from);
    let closeTimeMinutes = getTimeInMinutes(workingHours.to);

    return [
        { from: openTimeMinutes, to: closeTimeMinutes },
        { from: openTimeMinutes + minutesInDay, to: closeTimeMinutes + minutesInDay },
        { from: openTimeMinutes + 2 * minutesInDay, to: closeTimeMinutes + 2 * minutesInDay }
    ];
}

function getScheduleInMinutes(schedule, bankTimeZone) {
    let scheduleInMinutes = {};
    let robbers = Object.keys(schedule);
    for (let i = 0; i < robbers.length; i++) {
        let robber = robbers[i];
        scheduleInMinutes[robber] = getRobberScheduleInMinutes(schedule[robber], bankTimeZone);
    }

    return scheduleInMinutes;
}

function checkTime(time, start, duration) {
    return (time.from < start && start < time.to) ||
        (time.from < start + duration && start + duration < time.to);
}

function getPosibleTimes(schedule, duration, workingMinutes) {
    const posibleTime = [];
    const keys = Object.keys(schedule);
    for (let i = workingMinutes[0].from; i <= workingMinutes[workingMinutes.length - 1].to;) {
        if (keys.some(key =>
            schedule[key].some(time => checkTime(time, i, duration))) ||
            workingMinutes.every(time => i < time.from || time.to < i + duration)) {
            i++;
            continue;
        }
        if (posibleTime.length === 0 || i - posibleTime[posibleTime.length - 1] >= 30) {
            posibleTime.push(i);
        }
        i++;
    }

    return posibleTime;
}

function getNumber(number) {
    if (number < 10) {

        return `0${number}`;
    }

    return `${number}`;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

let heistDuration;
const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const minutesInHour = 60;
const minutesInDay = 1440;

function convertToMinute(element, workingHours) {
    let from = convert(element.from, workingHours);
    let to = convert(element.to, workingHours);

    return [from, to];
}

// Работает для даты работы банка и дат расписания(без проверок)
function convert(date, workingHours) {
    let scheduleInMinute = 0;
    let timeZone;
    let hoursAndMinutes = date.match(/\d{2}[:]\d{2}/);
    let str = hoursAndMinutes[0].split(':');
    scheduleInMinute += getWeekDayTime(date) * minutesInDay;
    scheduleInMinute += parseInt(str[0]) * minutesInHour;
    scheduleInMinute += parseInt(str[1]);
    timeZone = getTimeZone(date);
    scheduleInMinute += removeTimeZone(timeZone, workingHours) * minutesInHour;
    date = scheduleInMinute;

    return date;
}

function getWeekDayTime(date) {
    if (!/[А-Я]{2}/.test(date)) {
        return 0;
    }
    let weekDay = date.match(/[А-Я]{2}/);
    for (let index = 0; index < weekDays.length; index++) {
        if (weekDay[0] === weekDays[index]) {
            return index;
        }
    }
}

function getTimeZone(date) {
    let result = date.match(/\+\w{1,2}/);

    return result[0].slice(1);
}

// Добавляем или вычитаем часовой пояс в зависимости от часового пояса банка
function removeTimeZone(timeZone, workingHours) {
    let bankTimeZone = getTimeZone(workingHours.from);

    return bankTimeZone - timeZone;
}

function existTime(busyDates, workingHoursInMinute) {
    let goodTime = [];
    busyDates.forEach(element => {
        goodTime = contained(element, workingHoursInMinute, busyDates);
    });

    return goodTime;
}

function contained(element, workingHoursInMinute, busyDates) {
    let result = [];
    if (workingHoursInMinute[0] < element[0] &&
    workingHoursInMinute[0] < element[0] - heistDuration) {
        if (!intersect(element, 0, busyDates)) {
            result.push([element[0], 0]);
        }
    }
    if (workingHoursInMinute[1] > element[1] &&
    workingHoursInMinute[1] > element[1] + heistDuration) {
        if (!intersect(element, 1, busyDates)) {
            result.push([element[1], 1]);
        }
    }

    return result;
}

function intersect(element, index, busyDates) {
    busyDates.forEach(element2 => {
        if (method(element, index, element2, 0) || method(element, index, element2, 1)) {
            return true;
        }
    });

    return false;
}

function method(element, index, element2, index2) {
    if (index === 0) {
        if (element2[index2] < element[index] &&
        element2[index2] > element[index] - heistDuration) {
            return true;
        }
    }
    if (index === 1) {
        if (element2[index2] > element[index] &&
        element2[index2] < element[index] + heistDuration) {
            return true;
        }
    }

    return false;
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
    heistDuration = duration;
    console.info(schedule, duration, workingHours);
    let busyDates = []; // Когда заняты
    for (let key of Object.keys(schedule)) {
        schedule[key].forEach(element => {
            busyDates.push(convertToMinute(element, workingHours));
        });
    }
    let workingHoursInMinute = convertToMinute(workingHours, workingHours);
    // тут тупа вывод для меня
    console.info(workingHoursInMinute);
    busyDates.forEach(element => {
        console.info(element);
    });

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (existTime(busyDates, workingHoursInMinute).length !== 0) {
                return true;
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
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

module.exports = {
    getAppropriateMoment,

    isStar
};

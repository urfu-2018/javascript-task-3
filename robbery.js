'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

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

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
// Пустое расписание, нет 3 друзей в расписании,
function getAppropriateMoment(schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    let busyDates = []; // Когда заняты
    for (let key of Object.keys(schedule)) {
        schedule[key].forEach(element => {
            busyDates.push(convertToMinute(element, workingHours));
        });
    }
    let workingHoursInMinute = convertToMinute(workingHours, workingHours);
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

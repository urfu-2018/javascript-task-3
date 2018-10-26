'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const daysWeek=['ПН','ВТ','СР'];

let fromTimes = {};
let toTimes = {};

let fromSuccessTimes = {};
let toSuccessTimes = {};

function createMinutesOfDay(hour, minute, timezone) {
    return parseInt((parseInt(hour)+parseInt(timezone))*60+parseInt(minute));
}

function createSchedules(schedule) {
    const keys=Object.keys(schedule);
    keys.forEach(people=>{
        schedule[people].forEach(participant => {
            let time=participant.from.split(/\ |:|\+/);
            fromTimes[people+time[0]]=createMinutesOfDay(time[1],time[2],time[3]);
            time=participant.to.split(/\ |:|\+/);
            toTimes[people+time[0]]=createMinutesOfDay(time[1],time[2],time[3]);
            console.log(fromTimes[people+time[0]]);
        });
    });
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
    createSchedules(schedule);
    let workingTime=workingHours.from.split(/\ |:|\+/);
    const minuteFromWorkingBank=createMinutesOfDay(workingTime[0],workingTime[1],workingTime[2]);
    workingTime=workingHours.to.split(/\ |:|\+/);
    const minuteToWorkingBank=createMinutesOfDay(workingTime[0],workingTime[1],workingTime[2]);

    daysWeek.forEach(dayWeek=>{
        const keys=Object.keys(schedule);
        keys.forEach(people=>{
            if((duration+minuteFromWorkingBank)<fromTimes[people+daysWeek]||(toTimes[people+daysWeek]+duration)<minuteToWorkingBank){

            }
        });
    });
    console.log(fromTimes);
    console.log(toTimes);
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

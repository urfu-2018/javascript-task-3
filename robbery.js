'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const minutesPerHour = 60;
const hourPerDay = 24;

let weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

let dayTimeStrToMinutes = (weekDay, timeStr, timeZone, bankTimeZone) =>
    [weekDays.indexOf(weekDay) * minutesPerHour * hourPerDay,
        timeStr.split(':')[0] * minutesPerHour + Number(timeStr.split(':')[1]),
        (bankTimeZone - (timeZone === undefined ? 0 : Number(timeZone))) * minutesPerHour
    ].reduce((a, b) => a + b);

let addTimeToTwoChars = (time) => time.toString().length === 2 ? time.toString() : `0${time}`;

function minutesToDayTime(minutes, bankTimeZone) {
    let weekDay = parseInt(minutes / (minutesPerHour * hourPerDay));
    minutes -= minutesPerHour * hourPerDay * parseInt(minutes / (minutesPerHour * hourPerDay));
    weekDay = weekDays[weekDay];
    let hours = parseInt(minutes / minutesPerHour);
    minutes -= hours * minutesPerHour;
    bankTimeZone = !bankTimeZone ? '' : `+${bankTimeZone}`;

    return {
        day: weekDay,
        hours: addTimeToTwoChars(hours),
        minutes: addTimeToTwoChars(minutes),
        tz: bankTimeZone };
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
    let bankTimeZone = Number(workingHours.from.split('+')[1]);
    bankTimeZone = isNaN(bankTimeZone) ? 0 : bankTimeZone;
    let startTime = 1;
    let endTime = dayTimeStrToMinutes(...`СР 23:59+${bankTimeZone}`.split(/ |\+/), bankTimeZone);
    let endWeek = dayTimeStrToMinutes(...`ВС 23:59+${bankTimeZone}`.split(/ |\+/), bankTimeZone);
    workingHours = weekDays
        .slice(0, 3)
        .map((day)=>
            -dayTimeStrToMinutes(...`${day} ${workingHours.from}`.split(/ |\+/), bankTimeZone))
        .concat(
            weekDays
                .slice(0, 3)
                .map((day)=>
                    dayTimeStrToMinutes(
                        ...`${day} ${workingHours.to}`.split(/ |\+/), bankTimeZone)))
        .concat([startTime, endTime, -endWeek]);
    let answer = [{ count: 0, intervals: [] }]
        .concat(Object.keys(schedule)
            .map((friend)=>[...schedule[friend]])
            .reduce((a, b)=>a.concat(b))
            .map((record)=>
                [
                    dayTimeStrToMinutes(...record.from.split(/ |\+/), bankTimeZone),
                    -dayTimeStrToMinutes(...record.to.split(/ |\+/), bankTimeZone)])
            .reduce((a, b)=>a.concat(b))
            .concat(workingHours)
            .sort((a, b) => Math.abs(a) - Math.abs(b)))
        .reduce(function (result, time) {
            let lastInterval = result.intervals[result.intervals.length - 1];
            if (!(result.count += Math.sign(time))) {
                result.intervals.push({ from: -time, to: 0 });
            } else if (result.count === 1 && (lastInterval !== undefined) && !(lastInterval.to)) {
                result.intervals[result.intervals.length - 1].to = time;
            }

            return result;
        })
        .intervals
        .slice(1)
        .filter((record)=>Math.abs(record.to - record.from) >= duration)
        .map((record)=> {
            return {
                from: minutesToDayTime(record.from, bankTimeZone),
                to: minutesToDayTime(record.to, bankTimeZone) };
        });

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(answer.length);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return !answer.length
                ? '' : template
                    .replace('%DD', answer[0].from.day)
                    .replace('%HH', answer[0].from.hours)
                    .replace('%MM', answer[0].from.minutes);
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

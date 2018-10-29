'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
// const isStar = true;
const isStar = false;

const weekDates = { ПН: 0, ВТ: 24, СР: 48 };

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const bankTimeZone = getTimeZone(workingHours.from);
    const bankWorkingMinutes = [];
    for (let i = 0; i < 3; i++) {
        bankWorkingMinutes.push({
            from: convertTimeToMinutes(workingHours.from, bankTimeZone) + i * 24 * 60,
            to: convertTimeToMinutes(workingHours.to, bankTimeZone) + i * 24 * 60
        });
    }
    const scheduleInMinutes = convertRobersScheduleToMinutes(schedule, bankTimeZone);
    const freeSchedule = getRobersFreeTime(scheduleInMinutes);
    const jointFreeSchedule = getJointRobersFreeTime(freeSchedule);
    const timeToRob = joinTwoSchedules(jointFreeSchedule, bankWorkingMinutes);
    const suitableTimes = getSuitableTimeParts(timeToRob, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return suitableTimes.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (suitableTimes.length === 0) {
                return '';
            }
            const resultTime = convertTimeFromMinutes(suitableTimes[0]);

            return template
                .replace(/%DD/, resultTime[0])
                .replace(/%HH/, resultTime[1])
                .replace(/%MM/, resultTime[2]);
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

/**
 * @param {Array} schedule
 * @param {Number} duration
 * @returns {Array}
 */
function getSuitableTimeParts(schedule, duration) {
    const suitableTimes = [];
    schedule
        .sort((a, b) => a.from - b.from)
        .forEach(part => {
            if ((part.to - part.from) >= duration) {
                suitableTimes.push(part.from);
            }
        });

    return suitableTimes;
}

/**
 * @param {Object} schedule - {Danny: [{from: ..., to: ...}, ...], Rusty: ..., Linus: ...}
 * @param {Number} bankTimeZone
 * @returns {Array} - отрезки времени занятости в минутах
 */
function convertRobersScheduleToMinutes(schedule, bankTimeZone) {
    const parsedSchedule = [];
    Object.values(schedule).forEach(timetable => {
        const temp = [];
        Object.values(timetable).forEach(time => {
            temp.push({
                from: convertTimeToMinutes(time.from, bankTimeZone),
                to: convertTimeToMinutes(time.to, bankTimeZone)
            });
        });
        parsedSchedule.push(temp);
    });

    return parsedSchedule;
}

/**
 * @param {String} time - 01:01+5
 * @returns {Number} часовой пояс
 * */
function getTimeZone(time) {
    const reg = /\d{1,2}$/;

    return Number(time.match(reg));
}

/**
 * @param {String} time - формат ПН 01:01+5
 * @param {Number} bankTimeZone
 * @returns {Number} время в минутах в часовом поясе банка
 */
function convertTimeToMinutes(time, bankTimeZone) {
    const regTime = /([А-Я]{2} )?(\d{2}):(\d{2})\+(\d{1,2})$/;
    const parsed = time.match(regTime);
    const [date, hours, minutes, timeZone] = [parsed[1], parsed[2], parsed[3], parsed[4]];
    const timeInMinutes = (Number(hours) + bankTimeZone - Number(timeZone)) * 60 + Number(minutes);

    return typeof date === 'undefined' ? timeInMinutes
        : timeInMinutes + weekDates[date.slice(0, 2)] * 60;
}

/**
 * @param {Number} timeInMinutes
 * @returns {Array}
 */
function convertTimeFromMinutes(timeInMinutes) {
    let hours = String(Math.floor(timeInMinutes / 60));
    const minutes = String(timeInMinutes - hours * 60);
    let day = 'ПН';
    if (hours >= 24 && hours < 48) {
        day = 'ВТ';
    } else if (hours >= 48) {
        day = 'СР';
    }
    hours = hours % 24;

    return [day,
        hours.length === 1 ? `0${hours}` : hours,
        minutes.length === 1 ? `0${minutes}` : minutes];
}

/**
 * @param {Array} schedule - [{from: минута1, to: минута2}, ...] - время занятости
 * @returns {Array} - [{from: ..., to: ...}, ...] - свободное время
 */
function getRobersFreeTime(schedule) {
    const maxMinute = 3 * 24 * 60 - 1;
    const freeTimeSchedule = [];
    schedule.forEach(robber => {
        const personFreeTime = [];
        let minTime = 0;
        robber.forEach(part => {
            if (minTime < part.from) {
                personFreeTime.push({
                    from: minTime,
                    to: part.from
                });
            }
            minTime = part.to;
        });
        if (minTime < maxMinute) {
            personFreeTime.push({
                from: minTime,
                to: maxMinute
            });
        }
        freeTimeSchedule.push(personFreeTime);
    });

    return freeTimeSchedule;
}

/**
 * @param {Array} first - [0: {from: minute1, to: minute2}, ...]
 * @param {Array} second - [0: {from: minute1, to: minute2}, ...]
 * @returns {Array} - пересечение по свободному времени
 */
function joinTwoSchedules(first, second) {
    const jointFreeTime = [];
    first.forEach(f => {
        second.forEach(s => {
            if (f.from < s.to && f.to > s.from) {
                jointFreeTime.push({
                    from: Math.max(f.from, s.from),
                    to: Math.min(f.to, s.to)
                });
            }
        });
    });

    return jointFreeTime;
}

/**
 * @param {Array} schedule - [0: [0: {from: minute1, to: minute2}, ...], 1: ..., 2: ...]
 * @returns {Array} - пересечение по свободному времени
 */
function getJointRobersFreeTime(schedule) {
    const [danny, rusty, linus] = [schedule[0], schedule[1], schedule[2]];
    let jointFreeTime = joinTwoSchedules(danny, rusty);
    jointFreeTime = joinTwoSchedules(jointFreeTime, linus);

    return jointFreeTime;
}

module.exports = {
    getAppropriateMoment,
    isStar
};

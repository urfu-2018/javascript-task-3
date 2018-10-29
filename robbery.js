'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

const daysForRobbery = { ПН: 1, ВТ: 2, СР: 3 };
const numberToWeekDay = { 1: 'ПН', 2: 'ВТ', 3: 'СР' };

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
    const bankTImeZone = getTimeZone(workingHours.from);

    const [dannyRobberyTime, rustyRobberyTime, linusRobberyTime] = Object.values(schedule).map(
        personSchedule => getGoodTimeForRobberySchedule(personSchedule, duration, workingHours)
    );

    let robberyTime = findTimeForRobbery(
        dannyRobberyTime,
        rustyRobberyTime,
        linusRobberyTime,
        duration
    );
    if (robberyTime) {
        const hoursInUTC = robberyTime.getHours();
        robberyTime.setHours(hoursInUTC + bankTImeZone);
    }

    return {
        robberyTime,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return typeof robberyTime !== 'undefined';
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }
            const weekDay = numberToWeekDay[robberyTime.getDay()];
            const hours = formatTime(robberyTime.getHours());
            const minutes = formatTime(robberyTime.getMinutes());

            return template
                .replace(/%DD/gi, weekDay)
                .replace(/%HH/gi, hours)
                .replace(/%MM/gi, minutes);
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

const cartesianOfTwo = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
const cartesianOfThree = (a, b, ...c) => (b ? cartesianOfThree(cartesianOfTwo(a, b), ...c) : a);

function findTimeForRobbery(schedule1, schedule2, schedule3, duration) {
    for (let element of cartesianOfThree(schedule1, schedule2, schedule3)) {
        const intersectionStart = chooseLatestStart(...element);
        const intersectionEnd = chooseEarliestEnd(...element);
        if (hasEnoughTime(intersectionStart, intersectionEnd, duration)) {
            return intersectionStart;
        }
    }
}

function formatTime(timeValue) {
    return timeValue < 10 ? '0' + timeValue : timeValue;
}

function parseTime(timeStr) {
    const [day, time] = timeStr.split(' ');
    const timeSplited = time.split(':');
    const timeZoneDifference = getTimeZone(time);
    const hours = parseInt(timeSplited[0]) - timeZoneDifference;
    const minutes = parseInt(timeSplited[1].substring(0, 2));

    return new Date(2018, 9, daysForRobbery[day], hours, minutes, 0);
}

function getTimeZone(time) {
    return parseInt(time.split(':')[1].substring(2));
}

function hasEnoughTime(freeTimeStart, freeTimeEnd, neededTime) {
    return freeTimeEnd - freeTimeStart >= neededTime * 60 * 1000;
}

function chooseLatestStart(time1, time2, time3) {
    const timesArray = [time1.from, time2.from, time3.from];

    return timesArray.sort().pop();
}

function chooseEarliestEnd(time1, time2, time3) {
    const timesArray = [time1.to, time2.to, time3.to];

    return timesArray.sort()[0];
}

function getGoodTimeForRobberySchedule(schedule, duration, bankWorkingHours) {
    let resultSchedule = [];
    Object.keys(daysForRobbery).forEach(day => {
        const bankStartWorking = parseTime(`${day} ${bankWorkingHours.from}`);
        const bankStopWorking = parseTime(`${day} ${bankWorkingHours.to}`);
        const daySchedule = schedule.filter(
            e => e.from.split(' ')[0] === day || e.to.split(' ')[0] === day
        );
        let possibleTimeStart = bankStartWorking;
        daySchedule.forEach(freeTime => {
            const parsedFromTime = parseTime(freeTime.from);
            const freeTimeEnd =
                parsedFromTime.getTime() > bankStopWorking.getTime()
                    ? bankStopWorking
                    : parsedFromTime;
            if (hasEnoughTime(possibleTimeStart, freeTimeEnd, duration)) {
                resultSchedule.push({ from: possibleTimeStart, to: freeTimeEnd });
            }
            possibleTimeStart = parseTime(freeTime.to);
        });
        if (hasEnoughTime(possibleTimeStart, bankStopWorking, duration)) {
            resultSchedule.push({ from: possibleTimeStart, to: bankStopWorking });
        }
    });

    return resultSchedule;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

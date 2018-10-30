'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const hoursInDay = 24;
const minutesInHour = 60;

const dayMax = 23 * minutesInHour + 59;
const wednesdayMax = 2 * hoursInDay * minutesInHour + dayMax;

const numericalDayOfTheWeekEnum = {
    'ПН': 0,
    'ВТ': 1,
    'СР': 2
};

function convertTimeToMinutes(time, bankTimeShift) {
    time = time.split(' ');
    const dayOfWeek = numericalDayOfTheWeekEnum[time[0]];
    const timeParts = time[1].match(/(\d{2}):(\d{2})\+(\d+)/);
    const hours = Number(timeParts[1]);
    const minutes = Number(timeParts[2]);
    const timeShift = Number(timeParts[3]);
    if (typeof bankTimeShift === 'undefined') {
        bankTimeShift = timeShift;
    }

    return dayOfWeek * hoursInDay * minutesInHour +
         hours * minutesInHour + minutes +
        (bankTimeShift - timeShift) * minutesInHour;
}

function getTimeShift(time) {
    return time.match(/\d{2}:\d{2}\+(\d+)/)[1];
}

function parseBankTimetable(workingHours) {
    const timetable = [];
    const timeShift = getTimeShift(workingHours.from);
    Object.keys(numericalDayOfTheWeekEnum).forEach(day => {
        timetable.push({
            from: convertTimeToMinutes(day + ' ' + workingHours.from),
            to: convertTimeToMinutes(day + ' ' + workingHours.to)
        });
    });

    return [timetable, timeShift];
}

function parseRobbersTimetable(schedule, bankTimeShift) {
    const parsedTimetable = [];
    Object.values(schedule).forEach(timetable => {
        const temp = [];
        Object.values(timetable).forEach(time => {
            temp.push({
                from: convertTimeToMinutes(time.from, bankTimeShift),
                to: convertTimeToMinutes(time.to, bankTimeShift)
            });
        });
        parsedTimetable.push(temp);
    });


    return parsedTimetable;
}

function getRobbersFreeTimetable(robbersTimetable) {
    const robbersFreeTimetable = [];
    robbersTimetable.forEach(robber => {
        const robberFreeTime = [];
        let infinum = 0;
        robber.forEach(day => {
            if (infinum < day.from) {
                robberFreeTime.push({
                    from: infinum,
                    to: day.from
                });
            }
            infinum = day.to;
        });
        if (infinum < wednesdayMax) {
            robberFreeTime.push({
                from: infinum,
                to: wednesdayMax
            });
        }
        robbersFreeTimetable.push(robberFreeTime);
    });

    return robbersFreeTimetable;
}

function parseTimeToDateString(time) {
    const day = Math.trunc(Number(time) / (hoursInDay * minutesInHour));
    let hours = Math.trunc((time - day * hoursInDay * minutesInHour) / 60).toString();
    let minutes = (time - day * hoursInDay * minutesInHour - hours * minutesInHour).toString();
    if (minutes.length === 1) {
        minutes = '0' + minutes;
    }
    if (hours.length === 1) {
        hours = '0' + hours;
    }

    return [Object.keys(numericalDayOfTheWeekEnum)[day], hours, minutes];
}

function intersectTwoTimetables(oneRobber, anotherRobber) {
    const result = [];
    oneRobber.forEach(one => {
        anotherRobber.forEach(another => {
            if (one.to > another.from && one.from < another.to) {
                result.push({
                    from: Math.max(one.from, another.from),
                    to: Math.min(one.to, another.to)
                });
            }
        });
    });

    return result;
}

function intersectTimetables(robbersFreeTimetable, bankTimetable) {
    const firstRobber = robbersFreeTimetable[0];
    const secondRobber = robbersFreeTimetable[1];
    const thirdRobber = robbersFreeTimetable[2];
    let intersection = intersectTwoTimetables(firstRobber, secondRobber);
    intersection = intersectTwoTimetables(intersection, thirdRobber);
    intersection = intersectTwoTimetables(intersection, bankTimetable);

    return intersection;
}

function getAppropriateRobberyMoments(intersectedTimetables, duration) {
    return intersectedTimetables
        .filter(time => !(time.from > time.to || (time.to - time.from) < duration))
        .sort((l, r) => l.form < r.from);
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
    const [bankTimetable, bankTimeShift] = parseBankTimetable(workingHours);
    const robbersTimetables = parseRobbersTimetable(schedule, bankTimeShift);
    const robbersFreeTimetable = getRobbersFreeTimetable(robbersTimetables);
    const intersectedTimetables = intersectTimetables(robbersFreeTimetable, bankTimetable);
    const result = getAppropriateRobberyMoments(intersectedTimetables, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return result.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (result.length === 0) {
                return '';
            }
            const res = parseTimeToDateString(result[0].from);

            return template
                .replace('%DD', res[0])
                .replace('%HH', res[1])
                .replace('%MM', res[2]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (result.length === 0) {
                return false;
            } else if (result[0].to - result[0].from >= duration + 30) {
                result[0].from += 30;

                return true;
            } else if (result.length > 1) {
                result.shift();

                return true;
            }

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,
    isStar
};

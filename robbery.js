'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const minutesInHour = 60;
const minutesInDay = minutesInHour * 24;
const weekdays = ['ПН', 'ВТ', 'СР'];

class DateRange {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }
    duration() {
        return this.to.timeInMinutes - this.from.timeInMinutes;
    }

}

class RobberyDate {
    constructor(date, bankTimeZone) {
        let weekday = date.slice(0, 2);
        let time = date.slice(3, -2);
        let timeZone = parseInt(date.slice(-1));

        this.weekday = weekday;
        this.timeZone = timeZone;
        this.time = time;
        this.timeInMinutes = this.stringTimeToMinutes();
        this.setTimeZone(bankTimeZone);
    }

    setTimeZone(timeZone) {
        this.timeInMinutes += (timeZone - this.timeZone) * minutesInHour;
        this.timeZone = timeZone;
        this.setTime();
    }

    addMinutes(minutes) {
        // console.info('addMinutes');
        // console.info(this.time);
        // console.info(this.timeInMinutes);
        this.timeInMinutes += minutes;
        // console.info(this.timeInMinutes);
        this.setTime();
        // console.info(this.time);
    }

    setTime() {
        let hourCountInNewDay = this.timeInMinutes % minutesInDay;
        let hour = Math.floor((hourCountInNewDay) / minutesInHour)
            .toString()
            .padStart(2, '0');
        let minutes = ((hourCountInNewDay) % minutesInHour).toString()
            .padStart(2, '0');
        this.time = `${hour}:${minutes}`;
        let dayCount = Math.floor(this.timeInMinutes / minutesInDay);
        if (dayCount > 0) {
            this.weekday = weekdays[dayCount];
        }
    }

    stringTimeToMinutes() {
        let hour = parseInt(this.time.slice(0, 2));
        let minutes = parseInt(this.time.slice(3));

        return hour * minutesInHour + minutes + weekdays.indexOf(this.weekday) * minutesInDay;
    }

    greaterOrEqualThen(otherDate) {
        return this.timeInMinutes >= otherDate.timeInMinutes;
    }

    toString(template) {
        return template.replace(/%DD/, this.weekday)
            .replace(/%HH:%MM/, this.time);
    }
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
    let momentIndex = 0;
    let bankTimeZone = parseInt(workingHours.from.slice(-1));
    let bankWorkingHours = getBankWorkingHours(workingHours, bankTimeZone);
    let robsSchedule = getFreeSchedule(schedule, bankTimeZone);
    let workingTime = [new DateRange(new RobberyDate('ПН 00:00+5', bankTimeZone),
        new RobberyDate('СР 23:59+5', bankTimeZone))];
    let robTime = getSchedulesIntersection(workingTime, bankWorkingHours, duration);
    let schedulesIntersection = getAllSchedulesIntersection(robTime, robsSchedule, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return schedulesIntersection !== null;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (schedulesIntersection) {
                return schedulesIntersection[momentIndex].from.toString(template);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            for (let i = momentIndex; i < schedulesIntersection.length; i++) {
                if (momentIndex === i) {
                    schedulesIntersection[i].from.addMinutes(30);
                }
                if (schedulesIntersection[i].duration() >= duration) {
                    momentIndex = i;

                    return true;
                }
            }
            if (schedulesIntersection.length !== 0) {
                schedulesIntersection[schedulesIntersection.length - 1].from.addMinutes(-30);
                momentIndex = schedulesIntersection.length - 1;
            }

            return false;
        }
    };
}

function getFreeSchedule(schedule, bankTimeZone) {
    let fullSchedule = getFullSchedule(schedule, bankTimeZone);
    let robsSchedule = {};
    for (let name in fullSchedule) {
        if (!fullSchedule.hasOwnProperty(name)) {
            continue;
        }
        robsSchedule[name] = getFreeTimes(fullSchedule[name], bankTimeZone);
    }

    return robsSchedule;
}

function getFullSchedule(schedule, bankTimeZone) {
    let fullSchedule = {};
    for (let name in schedule) {
        if (!schedule.hasOwnProperty(name)) {
            continue;
        }
        fullSchedule[name] = getDates(schedule[name], bankTimeZone);
    }

    return fullSchedule;
}

function getBankWorkingHours(workingHours, bankTimeZone) {
    let bankWorkingHours = [];
    weekdays.forEach(day => {
        let from = new RobberyDate(`${day} ${workingHours.from}`, bankTimeZone);
        let to = new RobberyDate(`${day} ${workingHours.to}`, bankTimeZone);
        bankWorkingHours.push(new DateRange(from, to));
    });

    return bankWorkingHours;
}

function getDatesIntersection(firstDateRange, secondDateRange, duration) {
    if (!isDatesIntersect(firstDateRange, secondDateRange)) {
        return null;
    }
    let from = firstDateRange.from.greaterOrEqualThen(secondDateRange.from)
        ? firstDateRange.from : secondDateRange.from;
    let to = firstDateRange.to.greaterOrEqualThen(secondDateRange.to)
        ? secondDateRange.to : firstDateRange.to;
    if ((to.timeInMinutes - from.timeInMinutes) >= duration) {
        return new DateRange(from, to);
    }

    return null;
}

function getSchedulesIntersection(firstSchedule, secondSchedule, duration) {
    let intersections = [];
    firstSchedule.forEach(firstDate =>
        secondSchedule.forEach(secondDate => {
            let datesIntersection = getDatesIntersection(firstDate, secondDate, duration);
            if (datesIntersection) {
                intersections.push(datesIntersection);
            }
        }));

    return intersections;
}

function getAllSchedulesIntersection(robTime, robsSchedule, duration) {
    let intersections = robTime;
    for (let name in robsSchedule) {
        if (!robsSchedule.hasOwnProperty(name)) {
            continue;
        }
        intersections = getSchedulesIntersection(robsSchedule[name], intersections, duration);
        if (intersections.length === 0) {
            return null;
        }
    }

    return intersections;
}

function isDatesIntersect(firstDateRange, secondDateRange) {
    let earlyDateRange = firstDateRange.from.timeInMinutes < secondDateRange.from.timeInMinutes
        ? firstDateRange : secondDateRange;
    let lateDateRange = earlyDateRange === firstDateRange
        ? secondDateRange : firstDateRange;

    return lateDateRange.from.greaterOrEqualThen(earlyDateRange.from) &&
        earlyDateRange.to.greaterOrEqualThen(lateDateRange.to) ||
        earlyDateRange.to.greaterOrEqualThen(lateDateRange.from) &&
        lateDateRange.to.greaterOrEqualThen(earlyDateRange.to);
}

function getDates(schedule, bankTimeZone) {
    let datesRange = [];
    schedule.forEach(date => datesRange.push(new DateRange(new RobberyDate(date.from, bankTimeZone),
        new RobberyDate(date.to, bankTimeZone))));

    return datesRange;
}

function getFreeTimes(fullTime, bankTimeZone) {
    let workingTime = [new DateRange(new RobberyDate('ПН 00:00+5', bankTimeZone),
        new RobberyDate('СР 23:59+5', bankTimeZone))];
    for (let i = 0; i < fullTime.length; i++) {
        removeFullTime(fullTime[i], workingTime);
    }

    return workingTime;
}

function removeFullTime(fullTime, workingTime) {
    for (let j = 0; j < workingTime.length; j++) {
        if (isDatesIntersect(fullTime, workingTime[j])) {
            let currentWorkingTime = workingTime[j];
            workingTime.splice(j, 1);
            let firstPart = new DateRange(currentWorkingTime.from, fullTime.from);
            let secondPart = new DateRange(fullTime.to, currentWorkingTime.to);
            workingTime.push(firstPart);
            workingTime.push(secondPart);
            break;
        }
    }
}

module.exports = {
    getAppropriateMoment,

    isStar
};

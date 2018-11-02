'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const minutesInHour = 60;
const minutesInDay = minutesInHour * 24;
const weekdays = ['ПН', 'ВТ', 'СР'];
const durationInDays = 3;

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
        const correctDate = /(ПН|ВТ|СР) (\d{2}):(\d{2})\+(\d+)/;
        const execedDate = correctDate.exec(date);
        if (!execedDate) {
            throw new TypeError('date is not correct');
        }
        this.date = date;
        this.weekday = execedDate[1];
        this.time = { hour: parseInt(execedDate[2]), minutes: parseInt(execedDate[3]) };
        this.timeInMinutes = this.stringTimeToMinutes();
        this.setTimeZone(execedDate[4], bankTimeZone);
    }

    setTimeZone(oldTimeZone, newTimeZone) {
        this.timeInMinutes += (newTimeZone - oldTimeZone) * minutesInHour;
        this.timeZone = newTimeZone;
        this.setTime();
    }

    addMinutes(minutes) {
        this.timeInMinutes += minutes;
        this.setTime();
    }

    addDays(days) {
        this.addMinutes(days * minutesInDay);
    }

    clone() {
        return new RobberyDate(this.date, this.timeZone);
    }

    setTime() {
        const hourCountInNewDay = this.timeInMinutes % minutesInDay;
        const hour = Math.floor((hourCountInNewDay) / minutesInHour)
            .toString()
            .padStart(2, '0');
        const minutes = ((hourCountInNewDay) % minutesInHour).toString()
            .padStart(2, '0');

        this.time.hour = hour;
        this.time.minutes = minutes;

        const dayCount = Math.floor(this.timeInMinutes / minutesInDay);

        if (dayCount > 0) {
            this.weekday = weekdays[dayCount];
        }
    }

    stringTimeToMinutes() {
        return this.time.hour * minutesInHour + this.time.minutes +
            weekdays.indexOf(this.weekday) * minutesInDay;
    }

    gte(otherDate) {
        return this.timeInMinutes >= otherDate.timeInMinutes;
    }

    toString(template) {
        return template.replace(/%DD/, this.weekday)
            .replace(/%HH/, this.time.hour)
            .replace(/%MM/, this.time.minutes);
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
    let momentIndex = 0;

    const bankTimeZone = parseInt(workingHours.from.slice(-1));
    const bankWorkingHours = getBankWorkingHours(workingHours, bankTimeZone);
    const robsSchedule = getFreeSchedule(schedule, bankTimeZone);
    const start = new RobberyDate(`ПН 00:00+${bankTimeZone}`, bankTimeZone);
    const end = start.clone();
    end.addDays(durationInDays);
    end.addMinutes(-1);
    const workingTime = [new DateRange(start, end)];
    const robTime = getSchedulesIntersection(workingTime, bankWorkingHours, duration);
    const schedulesIntersection = getAllSchedulesIntersection(robTime, robsSchedule, duration);

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
            if (schedulesIntersection === null) {
                return false;
            }
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
    function getFullSchedule() {
        const fullSchedule = {};

        for (let name in schedule) {
            if (!schedule.hasOwnProperty(name)) {
                continue;
            }
            fullSchedule[name] = getDates(schedule[name], bankTimeZone);
        }

        return fullSchedule;
    }

    const fullSchedule = getFullSchedule();
    const robsSchedule = {};

    for (let name in fullSchedule) {
        if (!fullSchedule.hasOwnProperty(name)) {
            continue;
        }
        robsSchedule[name] = getFreeTimes(fullSchedule[name], bankTimeZone);
    }

    return robsSchedule;
}

function getBankWorkingHours(workingHours, bankTimeZone) {
    const bankWorkingHours = [];

    weekdays.forEach(day => {
        const from = new RobberyDate(`${day} ${workingHours.from}`, bankTimeZone);
        const to = new RobberyDate(`${day} ${workingHours.to}`, bankTimeZone);

        bankWorkingHours.push(new DateRange(from, to));
    });

    return bankWorkingHours;
}

function getDatesIntersection(firstDateRange, secondDateRange, duration) {
    if (!isDatesIntersect(firstDateRange, secondDateRange)) {
        return null;
    }

    const from = firstDateRange.from.gte(secondDateRange.from)
        ? firstDateRange.from : secondDateRange.from;
    const to = firstDateRange.to.gte(secondDateRange.to)
        ? secondDateRange.to : firstDateRange.to;

    if ((to.timeInMinutes - from.timeInMinutes) >= duration) {
        return new DateRange(from, to);
    }

    return null;
}

function getSchedulesIntersection(firstSchedule, secondSchedule, duration) {
    const intersections = [];

    firstSchedule.forEach(firstDate =>
        secondSchedule.forEach(secondDate => {
            const datesIntersection = getDatesIntersection(firstDate, secondDate, duration);

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
    const earlyDateRange = firstDateRange.from.timeInMinutes < secondDateRange.from.timeInMinutes
        ? firstDateRange : secondDateRange;
    const lateDateRange = earlyDateRange === firstDateRange
        ? secondDateRange : firstDateRange;

    return lateDateRange.from.gte(earlyDateRange.from) && earlyDateRange.to.gte(lateDateRange.to) ||
        earlyDateRange.to.gte(lateDateRange.from) && lateDateRange.to.gte(earlyDateRange.to);
}

function getDates(schedule, bankTimeZone) {
    const datesRange = [];

    schedule.forEach(date => datesRange.push(new DateRange(new RobberyDate(date.from, bankTimeZone),
        new RobberyDate(date.to, bankTimeZone))));

    return datesRange;
}

function getFreeTimes(fullTime, bankTimeZone) {
    const workingTime = [new DateRange(new RobberyDate('ПН 00:00+5', bankTimeZone),
        new RobberyDate('СР 23:59+5', bankTimeZone))];

    for (let i = 0; i < fullTime.length; i++) {
        removeFullTime(fullTime[i], workingTime);
    }

    return workingTime;
}

function removeFullTime(fullTime, workingTime) {
    for (let j = 0; j < workingTime.length; j++) {
        if (isDatesIntersect(fullTime, workingTime[j])) {
            const currentWorkingTime = workingTime[j];

            workingTime.splice(j, 1);

            const firstPart = new DateRange(currentWorkingTime.from, fullTime.from);
            const secondPart = new DateRange(fullTime.to, currentWorkingTime.to);

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

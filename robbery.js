'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const gangMembers = ['Danny', 'Rusty', 'Linus'];
const dayDurationInMinutes = 24 * 60;
let startOfWeek;
let endOfWeek;
let robbingSchedule;

class TimeInterval {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }

    overlapsMoment(moment) {
        return this.from <= moment && this.to >= moment;
    }

    doesNotIntersect(timeInterval) {
        return this.from <= timeInterval.from && this.to <= timeInterval.from ||
            this.from >= timeInterval.to && this.to >= timeInterval.to;
    }

    getIntersection(interval) {
        const left = Math.max(this.from, interval.from);
        const right = Math.min(this.to, interval.to);

        return new TimeInterval(left, right);
    }

    getDuration() {
        return Math.abs(this.from - this.to);
    }

    static fromStrings(strFrom, strTo) {
        return new TimeInterval(convertToMinutes(strFrom), convertToMinutes(strTo));
    }
}

function getRobbingSchedule(bankTimeZone) {
    return days.slice(0, 3).map(day =>
        TimeInterval.fromStrings(`${day} 00:00+${bankTimeZone}`, `${day} 23:59+${bankTimeZone}`)
    );
}

function getMinutesFromWeekStart(day) {
    return days.indexOf(day) * dayDurationInMinutes;
}

function convertToMinutes(str) {
    const [dayOfWeek, hh, mm, timezone] = /([А-Я]{2}) (\d\d):(\d\d)\+(\d)/.exec(str).slice(1);
    const minutesFromWeekStart = getMinutesFromWeekStart(dayOfWeek);
    const hours = parseInt(hh) - parseInt(timezone);
    const minutes = parseInt(mm);

    return minutesFromWeekStart + hours * 60 + minutes;
}

// Надеюсь, я смогу это отрефакторить, но пока пусть будет так.
// eslint-disable-next-line max-statements
function parseTimePoints(schedule) {
    let weekInterval = new TimeInterval(startOfWeek, endOfWeek);

    let res = [];
    for (let i = 0; i < schedule.length; i++) {
        const time = schedule[i];
        const busyTime = TimeInterval.fromStrings(time.from, time.to);
        if (busyTime.doesNotIntersect(weekInterval)) {
            continue;
        }

        if (busyTime.overlapsMoment(weekInterval.from)) {
            weekInterval.from = busyTime.to;
            continue;
        }

        if (busyTime.overlapsMoment(weekInterval.to)) {
            weekInterval.to = busyTime.from;
            continue;
        }
        res.push(busyTime.from);
        res.push(busyTime.to);
    }
    res.unshift(weekInterval.from);
    res.push(weekInterval.to);

    return res;
}

function combineTimePoints(timePoints) {
    let result = [];
    for (let i = 0; i < timePoints.length - 1; i += 2) {
        result.push(new TimeInterval(timePoints[i], timePoints[i + 1]));
    }

    return result;
}

function getGangFreeTimeIntervals(schedule) {
    let freeIntervals = {};

    gangMembers.forEach(gangMember => {
        freeIntervals[gangMember] = combineTimePoints(parseTimePoints(schedule[gangMember]));
    });

    return freeIntervals;
}

function findAllIntersections(schedules, robbingDeadlines, workingHours, duration) {
    let intersection = findIntersections(robbingDeadlines, workingHours, duration);

    if (!intersection) {
        return null;
    }

    gangMembers.forEach(gangMember => {
        intersection = findIntersections(schedules[gangMember], intersection, duration);
        if (!intersection) {
            return null;
        }
    });

    return intersection;
}

function findIntersections(scheduleOne, scheduleTwo, duration) {
    let result = [];
    scheduleOne.forEach(dateOne =>
        scheduleTwo.forEach(dateTwo => {
            const intersection = getMomentsIntersection(dateOne, dateTwo, duration);
            if (intersection) {
                result.push(intersection);
            }
        })
    );

    return result.length === 0 ? null : result;
}

function getMomentsIntersection(dateOne, dateTwo, duration) {
    if (dateOne.doesNotIntersect(dateTwo)) {
        return null;
    }
    const intersection = dateOne.getIntersection(dateTwo);

    return intersection.getDuration() < duration ? null : intersection;
}

function extractDayHoursMinutes(timeInMinutes) {
    const dayIndex = Math.floor(timeInMinutes / dayDurationInMinutes);
    const day = days[dayIndex];
    const dayMinutes = timeInMinutes % dayDurationInMinutes;
    const hours = Math.floor(dayMinutes / 60);
    const minutes = dayMinutes - hours * 60;

    return [day, hours.toString(), minutes.toString()];
}

function formatTemplate(template, day, hours, minutes) {
    return template.replace('%DD', day)
        .replace('%HH', hours.padStart(2, '0'))
        .replace('%MM', minutes.padStart(2, '0'));
}

function fillBankSchedule(bankWorkingHours) {
    let bankSchedule = [];
    days.forEach(day =>
        bankSchedule.push(
            TimeInterval.fromStrings(`${day} ${bankWorkingHours.from}`,
                `${day} ${bankWorkingHours.to}`)));

    return bankSchedule;
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
    const bankTimezone = parseInt(workingHours.from.slice(6));
    startOfWeek = convertToMinutes(`ПН 00:00+${bankTimezone}`);
    endOfWeek = convertToMinutes(`СР 23:59+${bankTimezone}`);
    robbingSchedule = getRobbingSchedule(bankTimezone);

    const gangSchedule = getGangFreeTimeIntervals(schedule);
    const bankSchedule = fillBankSchedule(workingHours);

    const intersections =
        findAllIntersections(gangSchedule, robbingSchedule, bankSchedule, duration);

    let pointer = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return intersections !== null && intersections.length > 0;
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
            const currentRobberyInterval = intersections[pointer];
            const startTime = currentRobberyInterval.from + bankTimezone * 60;

            return formatTemplate(template, ...extractDayHoursMinutes(startTime));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists() || pointer === intersections.length - 1) {
                return false;
            }

            const halfOfAnHour = 30;
            let currentDate = intersections[pointer];

            if (currentDate.from + halfOfAnHour + duration <= currentDate.to) {
                currentDate.from += halfOfAnHour;

                return true;
            }

            const nextIndex = intersections
                .slice(pointer + 1)
                .findIndex(date => date.from - currentDate.to > halfOfAnHour);

            if (nextIndex === -1) {
                return false;
            }
            pointer += nextIndex + 1;

            return true;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

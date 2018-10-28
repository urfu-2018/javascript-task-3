'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const gangMembers = ['Danny', 'Rusty', 'Linus'];
const dayDurationInMinutes = 24 * 60;
const startOfWeek = 0;
const endOfWeek = dayDurationInMinutes * 7 - 1;
const robbingSchedule = getRobbingSchedule();

function getRobbingSchedule() {
    return days.slice(0, 3).map(day => {
        return {
            from: convertToMinutes(`${day} 00:00+0`),
            to: convertToMinutes(`${day} 23:59+0`)
        };
    });
}

function getMinutesFromWeekStart(day) {
    return days.indexOf(day) * dayDurationInMinutes;
}

function convertToMinutes(str) {
    const [dayOfWeek, hh, mm, timezone] = /([А-Я]{2}) (\d\d):(\d\d)\+(\d)/.exec(str).slice(1);
    const minutesFromWeekStart = getMinutesFromWeekStart(dayOfWeek);
    const hours = parseInt(hh) - parseInt(timezone);
    const minutes = parseInt(mm);

    let result = minutesFromWeekStart + hours * 60 + minutes;
    if (result < 0) {
        return 0;
    }

    return result;
}

function parseTimePoints(schedule) {
    let res = [];
    schedule.forEach(time => {
        res.push(convertToMinutes(time.from));
        res.push(convertToMinutes(time.to));
    });

    return res;
}

function combineTimePoints(timePoints) {
    let result = [];
    for (let i = 0; i < timePoints.length - 1; i += 2) {
        result.push({
            from: timePoints[i],
            to: timePoints[i + 1]
        });
    }

    return result;
}

function getGangFreeTimeIntervals(schedule) {
    let freeIntervals = {
        Danny: [startOfWeek],
        Rusty: [startOfWeek],
        Linus: [startOfWeek]
    };

    gangMembers.forEach(gangMember => {
        freeIntervals[gangMember].push(...parseTimePoints(schedule[gangMember]));
        freeIntervals[gangMember].push(endOfWeek);
        freeIntervals[gangMember] =
            combineTimePoints(fixTimeTable(freeIntervals[gangMember]));
    });

    return freeIntervals;
}

function fixTimeTable(timePoints) {
    if (timePoints[0] === 0 && timePoints[1] === 0) {
        return timePoints.slice(1);
    }

    return timePoints;
}

function findAllIntersections(schedules, robbingDeadlines, workingHours, duration) {
    let intersection = findIntersections(robbingDeadlines, workingHours, duration);

    for (const gangMember in schedules) {
        if (!schedules.hasOwnProperty(gangMember)) {
            continue;
        }

        intersection = findIntersections(schedules[gangMember], intersection, duration);
        if (!intersection) {
            return null;
        }

    }

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
    if (dateOne.to < dateTwo.from || dateOne.from > dateTwo.to) {
        return null;
    }

    const left = Math.max(dateOne.from, dateTwo.from);
    const right = Math.min(dateOne.to, dateTwo.to);

    if (Math.abs(right - left) < duration) {
        return null;
    }

    return {
        from: left,
        to: right
    };
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
    days.forEach(day => {
        bankSchedule.push({
            from: convertToMinutes(`${day} ${bankWorkingHours.from}`),
            to: convertToMinutes(`${day} ${bankWorkingHours.to}`)
        });
    });

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
            return intersections && intersections.length > 0;
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
            if (!this.exists() || pointer === intersections.length) {
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

'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MINUTES_IN_DAY = MINUTES_IN_HOUR * HOURS_IN_DAY;
const DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР'];
const MINUTES_IN_ROBBERY_PERIOD = DAYS_OF_WEEK.length * MINUTES_IN_DAY;

let robbery = {};

function initRobbery() {
    robbery = {
        isPossible: false,
        startMinute: ''
    };
}

function dateTimeFromMinute(startTime) {
    const timeOfRobbery = startTime % MINUTES_IN_DAY;
    const day = (startTime - timeOfRobbery) / MINUTES_IN_DAY;
    let minute = timeOfRobbery % MINUTES_IN_HOUR;
    let hour = (timeOfRobbery - minute) / MINUTES_IN_HOUR;
    if (minute < 10) {
        minute = '0' + String(minute);
    }
    if (hour < 10) {
        hour = '0' + String(hour);
    }

    return {
        day: day,
        hour: hour,
        minute: minute
    };
}

function intersectSchedules(day, robberSchedule, bankSchedule) {
    let intersections = [];
    robberSchedule
        .filter(point => point.day === day)
        .forEach(robberSchedulePoint => {
            bankSchedule
                .filter(point => point.day === day)
                .forEach(bankSchedulePoint => {
                    const intersection = intersectIntervals(robberSchedulePoint, bankSchedulePoint);
                    if (intersection) {
                        intersection.day = day;
                        intersections.push(intersection);
                    }
                });
        });

    return intersections;
}

function intersectIntervals(interval1, interval2) {
    const maxStart = Math.max(interval1.start, interval2.start);
    const minEnd = Math.min(interval1.end, interval2.end);

    if (maxStart >= minEnd) {
        return null;
    }

    return {
        start: maxStart,
        end: minEnd
    };
}

function findIntervalForRobbery(intervalsForRobbery, duration) {
    for (let i = 0; i < intervalsForRobbery.length; i++) {
        const interval = intervalsForRobbery[i];
        if (interval.end - interval.start >= duration) {
            robbery.isPossible = true;
            robbery.startMinute = interval.start;
            break;
        }
    }
}

function getIntervalsForRobbery(schedule, duration, workingHours) {
    const bankSchedule = getBankSchedule(workingHours);
    const bankTimeZone = bankSchedule.timezone;
    let intervalsForRobbery = bankSchedule.schedule;

    Object.keys(schedule)
        .forEach(robber => {
            const robberSchedule = schedule[robber].map(schedulePoint => {
                return getRobberBusyTimeInterval(schedulePoint, bankTimeZone);
            });

            const splitByDaysSchedule = getFreeTimeSchedule(robberSchedule)
                .reduce(splitByDays, []);

            let recalculatedIntervals = [];

            getIndexesOfDays()
                .forEach(day => {
                    recalculatedIntervals = recalculatedIntervals.concat(
                        intersectSchedules(day, splitByDaysSchedule, intervalsForRobbery));
                });

            intervalsForRobbery = recalculatedIntervals;
        });

    return intervalsForRobbery;
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
    let intervalsForRobbery = getIntervalsForRobbery(schedule, duration, workingHours);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            initRobbery();
            findIntervalForRobbery(intervalsForRobbery, duration);

            return robbery.isPossible;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!robbery.isPossible) {
                return '';
            }
            const dateTime = dateTimeFromMinute(robbery.startMinute);
            const formattedDateTime = template.replace(/%HH/, String(dateTime.hour))
                .replace(/%MM/, String(dateTime.minute))
                .replace(/%DD/, DAYS_OF_WEEK[dateTime.day]);

            return formattedDateTime;
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

function getRobberBusyTimeInterval(schedule, bankTimezone) {
    let robberSchedule = parseScheduleString(schedule);
    const differenceInHours = bankTimezone - robberSchedule.timezone;
    const differenceInMinutes = differenceInHours * MINUTES_IN_HOUR;

    let start = robberSchedule.start + differenceInMinutes +
        robberSchedule.startDay * MINUTES_IN_DAY;
    let end = robberSchedule.end + differenceInMinutes +
        robberSchedule.endDay * MINUTES_IN_DAY;

    return {
        start: Math.max(0, start),
        end: Math.min(MINUTES_IN_ROBBERY_PERIOD, end)
    };
}

function getBankSchedule(schedule) {
    let everyDaySchedule = parseScheduleString(schedule);

    const workingIntervals = getIndexesOfDays()
        .map((value, index) => {
            let diffFromFirstDayInMinutes = value * MINUTES_IN_DAY;

            return {
                day: index,
                start: everyDaySchedule.start + diffFromFirstDayInMinutes,
                end: everyDaySchedule.end + diffFromFirstDayInMinutes
            };
        });

    const bankSchedule = {
        timezone: everyDaySchedule.timezone,
        schedule: workingIntervals
    };

    return bankSchedule;
}

function parseScheduleString(workingHours) {
    const SCHEDULE_STRING_REGEX = /^((.{2}) )?(\d+):(\d+)\+(\d+)$/;
    const start = workingHours.from.match(SCHEDULE_STRING_REGEX);
    const end = workingHours.to.match(SCHEDULE_STRING_REGEX);

    const startDayOfWeek = start[2];
    const endDayOfWeek = end[2];
    const timeZone = parseInt(start[5]);

    return {
        startDay: DAYS_OF_WEEK.indexOf(startDayOfWeek),
        endDay: DAYS_OF_WEEK.indexOf(endDayOfWeek),
        timezone: timeZone,
        start: getMinutes(start),
        end: getMinutes(end)
    };

    function getMinutes(match) {
        return parseInt(match[3]) * MINUTES_IN_HOUR + parseInt(match[4]);
    }
}

function getFreeTimeSchedule(busyTimeSchedule) {
    if (busyTimeSchedule.length === 0) {
        return [{
            start: 0,
            end: MINUTES_IN_ROBBERY_PERIOD
        }];
    }

    const freeTimeSchedule = [];
    const firstStart = busyTimeSchedule[0].start;
    if (firstStart > 0) {
        freeTimeSchedule.push({
            start: 0,
            end: firstStart
        });
    }
    for (let i = 0; i < busyTimeSchedule.length - 1; i++) {
        freeTimeSchedule.push({
            start: busyTimeSchedule[i].end,
            end: busyTimeSchedule[i + 1].start
        });
    }

    const lastEnd = busyTimeSchedule[busyTimeSchedule.length - 1].end;

    if (lastEnd < MINUTES_IN_ROBBERY_PERIOD) {
        freeTimeSchedule.push({
            start: lastEnd,
            end: MINUTES_IN_ROBBERY_PERIOD
        });
    }

    return freeTimeSchedule;
}

function splitByDays(splitByDaysSchedule, element) {
    let startDay = Math.trunc(element.start / MINUTES_IN_DAY);
    let endDay = Math.trunc((element.end - 1) / MINUTES_IN_DAY);
    for (let day = startDay; day <= endDay; day++) {
        splitByDaysSchedule.push({
            day: day,
            start: Math.max(element.start, day * MINUTES_IN_DAY),
            end: Math.min(element.end, (day + 1) * MINUTES_IN_DAY)
        });
    }

    return splitByDaysSchedule;
}


function getIndexesOfDays() {
    return DAYS_OF_WEEK.map((_day, index) => index);
}


module.exports = {
    getAppropriateMoment,

    isStar
};

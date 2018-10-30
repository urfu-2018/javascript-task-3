'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MINUTES_IN_DAY = MINUTES_IN_HOUR * HOURS_IN_DAY;
const HALF_AN_HOUR = 30;
const DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР'];
let robbery = {};
function tryAgain() {
    robbery = {
        possibility: {
            isPossible: false
        },
        startMinute: '',
        tryLater: false
    };
}
function getDataAndTimeFromMinute(startTime) {
    let mod = startTime % MINUTES_IN_DAY;
    let day = (startTime - mod) / MINUTES_IN_DAY;
    let minute = mod % MINUTES_IN_HOUR;
    let hour = (mod - minute) / MINUTES_IN_HOUR;
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
function intersectRobberAndBankSheduleInDayPeriod(day, robberSchedule, bankSchedule) {
    let intersections = [];
    robberSchedule.filter(r => r.day === day).forEach(robberSchedulePoint => {
        bankSchedule.filter(b => b.day === day).forEach(bankSchedulePoint => {
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
        return undefined;
    }

    return {
        start: maxStart,
        end: minEnd
    };
}
function changeRobberyFields(currentInterval, duration) {
    if (currentInterval.end - currentInterval.start < duration) {
        return false;
    }
    robbery.possibility.isPossible = true;
    Object.freeze(robbery.possibility);
    robbery.startMinute = currentInterval.start;

    return true;
}
function tryLaterInternal(currentInterval, duration) {
    const start = Math.max(robbery.startMinute + HALF_AN_HOUR, currentInterval.start);
    if (currentInterval.end - start < duration) {
        return false;
    }
    robbery.startMinute = start;
    robbery.tryLater = true;

    return true;
}
function tryLater(intervalsForRobbery, duration) {
    for (let i = 0; i < intervalsForRobbery.length; i++) {
        if (tryLaterInternal(intervalsForRobbery[i], duration)) {
            break;
        }
    }
}
function fillRobberyFields(intervalsForRobbery, duration) {
    for (let i = 0; i < intervalsForRobbery.length; i++) {
        if (changeRobberyFields(intervalsForRobbery[i], duration)) {
            break;
        }
    }
}
function getTimesToRobbery(schedule, duration, workingHours) {
    let informationAboutBank = getInformationAboutBank(workingHours);
    const bankTimeZone = informationAboutBank.timezone;
    let bankSchedule = informationAboutBank.schedule;
    Object.keys(schedule).forEach(robber => {
        let robberSchedule = schedule[robber].map(schedulePoint => {
            return getRobberBusyTimeInterval(schedulePoint, bankTimeZone);
        });
        let splitByDaysSchedule =
            getFreeTimeSchedule(robberSchedule)
                .reduce(splitByDays, []);
        let recalculatedBankSchedule = [];
        getIndexesOfDays().forEach(day => {
            recalculatedBankSchedule = recalculatedBankSchedule.concat(
                intersectRobberAndBankSheduleInDayPeriod(day, splitByDaysSchedule, bankSchedule));
        });
        bankSchedule = recalculatedBankSchedule;
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
    let bankSchedule = getTimesToRobbery(schedule, duration, workingHours);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            tryAgain();
            fillRobberyFields(bankSchedule, duration);

            return robbery.possibility.isPossible;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robbery.possibility.isPossible === false) {
                return '';
            }
            let data = getDataAndTimeFromMinute(robbery.startMinute);
            let str = template.replace(/%HH/, String(data.hour))
                .replace(/%MM/, String(data.minute))
                .replace(/%DD/, DAYS_OF_WEEK[data.day]);

            return str;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            tryLater(bankSchedule, duration);

            return robbery.tryLater;
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
        end: Math.min(DAYS_OF_WEEK.length * MINUTES_IN_DAY, end)
    };
}
function getInformationAboutBank(schedule) {
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

    return {
        startDay: DAYS_OF_WEEK.indexOf(start[2]),
        endDay: DAYS_OF_WEEK.indexOf(end[2]),
        timezone: parseInt(start[5]),
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
            end: DAYS_OF_WEEK.length * MINUTES_IN_DAY
        }];
    }
    let freeTimeSchedule = [];
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
    if (lastEnd <
        DAYS_OF_WEEK.length * MINUTES_IN_DAY) {
        freeTimeSchedule.push({
            start: lastEnd,
            end: DAYS_OF_WEEK.length * MINUTES_IN_DAY
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
    return Array.from(Array(DAYS_OF_WEEK.length).keys());
}
module.exports = {
    getAppropriateMoment,

    isStar
};

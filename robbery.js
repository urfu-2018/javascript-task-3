'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

// const bankTimeZone = getBankTimeZone(workingHours);
// translateTimeRangesToStandard(schedule, bankTimeZone);
// const freeTime = getFreeTime(schedule);

function getAppropriateMoment(schedule, duration, workingHours) {
    // console.info(schedule, duration, workingHours);
    const bankTimeZone = getTimeZone(workingHours.from);
    let workSchedule = workingHoursToSchedule(workingHours);
    workSchedule = dateScheduleToMinutesSchedule(workSchedule, bankTimeZone);
    const freeTimeSchedule = {};
    Object.keys(schedule).forEach(function (key) {

        /*
        dateScheduleToMinutesSchedule(schedule[key], bankTimeZone);
        freeTimeSchedule[key] = getFreeTimeSchedule(schedule[key]);
        */

        const minutesSchedule = dateScheduleToMinutesSchedule(schedule[key], bankTimeZone);
        freeTimeSchedule[key] = getFreeTimeSchedule(minutesSchedule);
    });
    let intersectedSchedule = workSchedule;
    Object.keys(freeTimeSchedule).forEach(function (key) {
        intersectedSchedule = intersectSchedules(intersectedSchedule, freeTimeSchedule[key]);
    });
    intersectedSchedule.sort(compareTimeRanges);
    const appropriateMoments = [];
    intersectedSchedule.forEach(function (timeRange) {
        let moment = timeRange.from;
        while (timeRange.to - moment >= duration) {
            appropriateMoments.push(minutesToDateObject(moment));
            moment += 30;
        }
    });

    return {
        moments: appropriateMoments,
        index: 0,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return this.moments.length !== 0;
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
            const moment = this.moments[this.index];
            template = template.replace(/%DD/, moment.day);
            template = template.replace(/%HH/, moment.hours);
            template = template.replace(/%MM/, moment.minutes);

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (this.moments[this.index + 1] === undefined) {
                return false;
            }
            this.index += 1;

            return true;
        }
    };
}

const weekDays = ['ПН', 'ВТ', 'СР'];
const minutessInHour = 60;
const minutesInDay = minutessInHour * 24;

function getWeekday(dateString) {
    return dateString.substring(0, 2);
}

function getHours(dateString) {
    return parseInt(dateString.substring(3, 5));
}

function getMinutes(dateString) {
    return parseInt(dateString.substring(6, 8));
}

function getTimeZone(dateString) {
    return parseInt(dateString.match(/\+\d{1,2}/)[0].substring(1));
}

function workingHoursToSchedule(workingHours) {
    const workSchedule = [];
    weekDays.forEach(function (weekday) {
        const daySchedule = { 'from': weekday + ' ' + workingHours.from,
            'to': weekday + ' ' + workingHours.to };
        workSchedule.push(daySchedule);
    });

    return workSchedule;
}

function dateToMinutesFromWeekStart(date, bankTimeZone) {
    let minutes = 0;
    minutes += weekDays.indexOf(getWeekday(date)) * minutesInDay;
    minutes += getHours(date) * minutessInHour;
    minutes += getMinutes(date);
    minutes += (bankTimeZone - getTimeZone(date)) * minutessInHour;

    return minutes;
}

function dateScheduleToMinutesSchedule(schedule, bankTimeZone) {
    const minutesSchedule = [];
    schedule.forEach(function (timeRange) {

        /*
        timeRange.from = dateToMinutesFromWeekStart(timeRange.from, bankTimeZone);
        timeRange.to = dateToMinutesFromWeekStart(timeRange.to, bankTimeZone);
        */

        const from = dateToMinutesFromWeekStart(timeRange.from, bankTimeZone);
        const to = dateToMinutesFromWeekStart(timeRange.to, bankTimeZone);
        minutesSchedule.push({ 'from': from, 'to': to });
    });

    return minutesSchedule;
}

function getFreeTimeSchedule(schedule) {
    const freeTimeSchedule = [];
    let leftBorder = 0;
    schedule.forEach(function (timeRange) {
        if (leftBorder < timeRange.from) {
            const freeTimeRange = { 'from': leftBorder, 'to': timeRange.from };
            freeTimeSchedule.push(freeTimeRange);
        }
        leftBorder = timeRange.to;
    });
    const endOfWeek = weekDays.length * minutesInDay;
    if (leftBorder < endOfWeek) {
        const freeTimeRange = { 'from': leftBorder, 'to': endOfWeek };
        freeTimeSchedule.push(freeTimeRange);
    }

    return freeTimeSchedule;
}

function intersectSchedules(first, second) {
    const intersectedSchedule = [];
    first.forEach(function (timeRange1) {
        second.forEach(function (timeRange2) {
            let intersection = getIntersection(timeRange1, timeRange2);
            if (Object.keys(intersection).length !== 0) {
                intersectedSchedule.push(intersection);
            } else {
                intersection = getIntersection(timeRange2, timeRange1);
                if (Object.keys(intersection).length !== 0) {
                    intersectedSchedule.push(intersection);
                }
            }
        });
    });

    return intersectedSchedule;
}

function getIntersection(timeRange1, timeRange2) {
    let intersection = {};
    if (timeRange1.from <= timeRange2.from && timeRange2.from <= timeRange1.to) {
        if (timeRange2.to >= timeRange1.to) {
            intersection = { 'from': timeRange2.from, 'to': timeRange1.to };
        } else {
            intersection = { 'from': timeRange2.from, 'to': timeRange2.to };
        }
    }

    return intersection;
}

function minutesToDateObject(minutes) {
    const daysCount = Math.floor(minutes / minutesInDay);
    const d = weekDays[daysCount];
    minutes -= daysCount * minutesInDay;
    const hoursCount = Math.floor(minutes / minutessInHour);
    const h = numberToTwoDigitableString(hoursCount);
    minutes -= hoursCount * minutessInHour;
    const m = numberToTwoDigitableString(minutes);

    return { 'day': d, 'hours': h, 'minutes': m };

}

function numberToTwoDigitableString(number) {
    if (number < 10) {
        return '0' + number;
    }

    return number.toString();
}

function compareTimeRanges(a, b) {
    if (a.from >= b.from) {
        return 1;
    }

    return -1;
}

/*
const year = '2018';
const month = '01';
const weekDayToDateDay = { 'ПН': '01', 'ВТ': '02', 'СР': '03', 'ЧТ': '04', 'ПТ': '05',
    'СБ': '06', 'ВС': '07' };

function getWeekday(dateString) {
    return dateString.substring(0, 2);
}

function getHours(dateString) {
    return dateString.substring(3, 5);
}

function getMinutes(dateString) {
    return dateString.substring(6, 8);
}

function getTimeZone(dateString) {
    let timeZone = dateString.match(/\+\d{1,2}/)[0].substring(1);
    if (timeZone.length === 1) {
        timeZone = '0' + timeZone;
    }

    return timeZone;
}

function getFullDateString(day, hours, minutes, timeZone) {

    // return `${year}-${month}-${day}T${hours}:${minutes}:00+${timeZone}00`;

    return `${year}-${month}-${day}T${hours}:${minutes}:00.000+${timeZone}:00`;
}

function toDate(dateString, commonTimeZone) {
    const day = weekDayToDateDay[getWeekday(dateString)];
    const hours = getHours(dateString);
    const minutes = getMinutes(dateString);
    const timeZone = getTimeZone(dateString);
    const fullDateString = getFullDateString(day, hours, minutes, timeZone);
    const gmtMilliseconds = Date.parse(fullDateString);
    // const withOffset = gmtMilliseconds + commonTimeZone * 1000 * 60 * 60;

    return new Date(gmtMilliseconds);
}

function getBankTimeZone(bankWorkingHours) {
    return parseInt(getTimeZone(bankWorkingHours.from));
}

function translateTimeRangesToStandard(schedule, commonTimeZone) {
    Object.keys(schedule).forEach(function (key) {
        schedule[key].forEach(function (range) {
            range.from = toDate(range.from, commonTimeZone);
            range.to = toDate(range.to, commonTimeZone);
        });
        schedule[key].sort(compareTimeRanges);
    });
}

function compareTimeRanges(a, b) {
    if (a.from >= b.from) {
        return 1;
    }

    return -1;
}

function getFreeTime(schedule) {
    const freeTime = {};
    Object.keys(schedule).forEach(function (key) {
        freeTime[key] = [];
        let leftBorder = new Date(2018, 0, 1, 0, 0, 0);
        schedule[key].forEach(function (range) {
            let freeRange = {};
            if (leftBorder !== range.from) {
                if (leftBorder.getDay() !== range.from.getDay()) {
                    while (leftBorder.getDay() !== range.from.getDay()) {
                        const rightBorder = new Date(leftBorder);
                        rightBorder.setHours(23);
                        rightBorder.setMinutes(59);
                        freeRange = { from: leftBorder, to: rightBorder };
                        freeTime[key].push(freeRange);
                        leftBorder = new Date(rightBorder.setMinutes(60));
                    }
                }
                freeRange = { from: leftBorder, to: range.from };
                freeTime[key].push(freeRange);
            }
            leftBorder = range.to;
        });
    });

    return freeTime;
}
*/

module.exports = {
    getAppropriateMoment,
    isStar
};

// Найти часовой пояс банка
// Привести все временные промежутки к этому часовому поясу
// Найти свободное время у всех грабителей
// Обрезать свободное время по времени работы банка
// Найти пересечения всех свободных времен грабитилей

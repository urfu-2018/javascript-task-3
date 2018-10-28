'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const minutesInHour = 60;
const minutesInDay = 1440;
let appropriateMoment;

function convertToMinute(element, workingHours) {
    let from = convert(element.from, workingHours);
    let to = convert(element.to, workingHours);

    return [from, to];
}

// Работает для даты работы банка и дат расписания(без проверок)
function convert(date, workingHours) {
    let scheduleInMinute = 0;
    let timeZone;
    let hoursAndMinutes = date.match(/\d{2}[:]\d{2}/);
    let str = hoursAndMinutes[0].split(':');
    scheduleInMinute += parseInt(getWeekDayTime(date)) * minutesInDay;
    scheduleInMinute += parseInt(str[0]) * minutesInHour;
    scheduleInMinute += parseInt(str[1]);
    timeZone = getTimeZone(date);
    scheduleInMinute += parseInt(removeTimeZone(timeZone, workingHours)) * minutesInHour;
    date = scheduleInMinute;

    return date;
}

function getWeekDayTime(date) {
    if (!/[А-Я]{2}/.test(date)) {
        return 0;
    }
    let weekDay = date.match(/[А-Я]{2}/);
    for (let index = 0; index < weekDays.length; index++) {
        if (weekDay[0] === weekDays[index]) {
            return index;
        }
    }
}

function getTimeZone(date) {
    let result = date.match(/\+\w{1,2}/);

    return result[0].slice(1);
}

// Добавляем или вычитаем часовой пояс в зависимости от часового пояса банка
function removeTimeZone(timeZone, workingHours) {
    let bankTimeZone = getTimeZone(workingHours.from);

    return bankTimeZone - timeZone;
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
    let busyDates = []; // Когда заняты
    for (let key of Object.keys(schedule)) {
        schedule[key].forEach(element => {
            busyDates.push(convertToMinute(element, workingHours));
        });
    }
    let workingHoursInMinute = convertToMinute(workingHours, workingHours);
    busyDates.sort((a, b) => {
        return a[0] - b[0];
    });

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            appropriateMoment = getMoment(busyDates, duration, workingHoursInMinute);
            if (typeof appropriateMoment !== 'undefined') {
                return true;
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (typeof appropriateMoment === 'undefined') {
                return '';
            }
            let day = getAnswer(appropriateMoment.goodMoment, minutesInDay);
            let timeWithoutDays = appropriateMoment.goodMoment - day * minutesInDay;
            let hour = getAnswer(timeWithoutDays, minutesInHour);
            let timeWithoutHours = timeWithoutDays - hour * minutesInHour;
            let minute = timeWithoutHours;

            return template.replace('%DD', weekDays[day])
                .replace('%HH', toTwoElement(hour))
                .replace('%MM', toTwoElement(minute));
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

function toTwoElement(element) {
    element = element.toString();
    if (element.length === 1) {
        return '0' + element;
    }

    return element;
}

function getAnswer(time, divider) {
    return Math.floor(time / divider);
}

function getMoment(busyDates, duration, workingHoursInMinute) {
    let resultTo = [];
    for (let index = 0; index < 3; index++) {
        let workingTime = [workingHoursInMinute[0] + index * minutesInDay,
            workingHoursInMinute[1] + index * minutesInDay];
        busyDates = removePreviouslyDates(busyDates, workingTime[0]);
        resultTo = getGoodTiming(busyDates, duration, workingTime);
        if (typeof resultTo !== 'undefined') {
            return {
                goodMoment: resultTo.sector
            };
        }
    }
}

function removePreviouslyDates(busyDates, startBankTime) {
    let result = [];
    for (let element of busyDates) {
        if (element[1] >= startBankTime) {
            result.push(element);
        }
    }

    return result;
}

function getGoodTiming(busyDates, duration, workingTime) {
    if (workingTime[1] - workingTime[0] < duration) {
        return;
    }
    let from = workingTime[0];
    while (from <= workingTime[1]) {
        let sector = [from, from + duration];
        let result = mergeIntersections(busyDates, sector, workingTime, duration);
        if (result.sector[1] + duration > workingTime[1] && !result.hasGoodTiming) {
            break;
        }
        if (result.hasGoodTiming) {
            return {
                sector: result.sector[0]
            };
        }
        from = result.sector[1];
    }
}

function mergeIntersections(busyDates, sector, workingTime, duration) {
    let hasGoodTiming = true;
    let countShift = 0;
    for (let element of busyDates) {
        let result = hasIntersections(sector, element);
        sector = result.sector;
        if (workingTime[1] - duration < sector[1] && !hasGoodTiming) {
            return {
                sector: sector,
                hasGoodTiming: false
            };
        }
        if (!result.hasIntersect) {
            busyDates = shiftElements(busyDates, countShift);

            return {
                sector: sector,
                hasGoodTiming: hasGoodTiming
            };
        }
        if (sector[1] < workingTime[0] + minutesInDay) {
            hasGoodTiming = false;
            countShift++;
        }
    }

    return {
        sector: sector,
        hasGoodTiming: hasGoodTiming
    };
}

function shiftElements(busyDates, countShift) {
    while (countShift !== 0) {
        busyDates.shift();
        countShift--;
    }

    return busyDates;
}

function hasIntersections(element, element2) {
    for (let index = 0; index < 2; index++) {
        let usuallIntersection = checkIntersections(element, element2, index, 0);
        if (usuallIntersection.hasIntersect) {
            return usuallIntersection;
        }
        let reverseIntesection = checkIntersections(element2, element, index, 1);
        if (reverseIntesection.hasIntersect) {
            return reverseIntesection;
        }
    }

    return {
        sector: element,
        hasIntersect: false
    };
}

function checkIntersections(element, element2, index, flag) {
    if (element[0] < element2[index] && element2[index] < element[1]) {
        if (!flag) {
            element[1] = element2[1];

            return {
                sector: element,
                hasIntersect: true
            };
        }
        element2[1] = element[1];

        return {
            sector: element2,
            hasIntersect: true
        };
    }

    return {
        sector: arguments[flag],
        hasIntersect: false
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

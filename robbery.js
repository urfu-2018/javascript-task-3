'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

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

/* function mergeIntersections(element, busyDates) {
    let preResult = [1, 0];// 1просто так, 0 ложное значение для проверок
    for (let index = busyDates.indexOf(element); index < busyDates.length; index++) {
        if (preResult[1]) { // если мы дошли до отрезка который не входит в текущий,
            // то значит и все остальные тоже лишние (sort)
            break;
        }
        if (element === busyDates[index] || busyDates[index].length !== 2) {
            continue;
        }
        preResult = toCombine(element, busyDates[index], preResult[1]);
        element = preResult[0];
        if (!preResult[1]) {
            delete busyDates[index];
        }
    }

    return element;
}

function toCombine(element, element2, flag) {
    if (element[0] <= element2[0] && element2[0] <= element[1]) {
        if (element2[1] > element[1]) {
            element[1] = element2[1];
        }

        return [element, flag];
    }
    if (element[0] <= element2[1] && element2[1] <= element[1]) {
        element[0] = element2[0];

        return [element, flag];
    }
    flag = true;

    return [element, flag];
}*/

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
    // let combinedDates = [];
    busyDates.sort((a, b) => {
        return a[0] - b[0];
    });

    /* busyDates.forEach(element => {
        console.info(element);
    });*/

    /* busyDates.forEach(element => {
        element = mergeIntersections(element, busyDates);
        if (element.length !== 0) {
            combinedDates.push(element);
        }
    });*/
    // тут тупа вывод для меня
    // console.info(workingHoursInMinute + '       ETO VREMYA BANKA');

    /* combinedDates.forEach(element => {
        console.info(element);
    });*/

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
            appropriateMoment -= getTimeZone(workingHours.from) * minutesInHour;
            let day = getAnswer(appropriateMoment, minutesInDay);
            let timeWithoutDays = appropriateMoment - day * minutesInDay;
            let hour = getAnswer(timeWithoutDays, minutesInHour);
            let timeWithoutHours = timeWithoutDays - hour * minutesInHour;
            let minute = timeWithoutHours;
            console.info(minute);

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
    let result = [];
    for (let index = 0; index < 3; index++) {
        let workingTime = [workingHoursInMinute[0] + index * minutesInDay,
            workingHoursInMinute[1] + index * minutesInDay];
        result = getGoodTiming(busyDates, duration, workingTime);
        if (typeof result !== 'undefined') {
            break;
        }
    }

    return result;
}

function getGoodTiming(busyDates, duration, workingTime) {
    for (let from = workingTime[0]; from <= workingTime[1] - duration; from += duration) {
        let sector = [from, from + duration];
        let result = getIntersections(busyDates, sector);
        if (result[1]) {
            return result[0][1] - duration;
        }
        from = result[0][1] - duration;
    }
}

function getIntersections(busyDates, sector) {
    let hasGoodTiming = true;
    let countShift = 0;
    busyDates.forEach(element => {
        let result = hasIntersections(sector, element);
        sector = result[0];
        if (!result[1]) {
            busyDates = shiftElements(busyDates, countShift);

            return [sector, hasGoodTiming];
        }
        hasGoodTiming = false;
        countShift++;
    });

    return [sector, hasGoodTiming];
}

function shiftElements(busyDates, countShift) {
    while (countShift !== 0) {
        busyDates.shift();
        countShift--;
    }

    return busyDates;
}

function hasIntersections(element, element2) {
    if (element[0] <= element2[0] && element2[0] <= element[1]) {
        if (element2[1] > element[1]) {
            element[1] = element2[1];
        }

        return [element, true];
    }
    if (element[0] <= element2[1] && element2[1] <= element[1]) {
        element[1] = element2[1];

        return [element, true];
    }

    return [element, false];
}

module.exports = {
    getAppropriateMoment,

    isStar
};

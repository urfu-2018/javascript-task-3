'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const minutesInHour = 60;
const minutesInDay = 1440;
let goodSectors;

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

function mergeIntersections(element, busyDates) {
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
}

function getFreeSectors(combinedDates, duration) {
    let result = [];
    let t = 0;
    for (let element of combinedDates) {
        let preRes = hasFreeSectors(element, t, duration);
        if (typeof preRes.freeSectors !== 'undefined') {
            result.push(preRes.freeSectors);
        }
        t = preRes.t;
        if (t > minutesInDay * 3) {
            return result;
        }
    }
    if (t < minutesInDay * 3) {
        result.push([t, minutesInDay * 3 - 1]);
    }

    return result;
}

function hasFreeSectors(element, t, duration) {
    let result;
    if (element[0] - t >= duration) {
        result = [t, element[0]];
    }
    t = element[1];

    return {
        freeSectors: result,
        t: t
    };
}

function getGoodSectors(freeSectors, workingHoursInMinute, duration) {
    if (workingHoursInMinute[1] - workingHoursInMinute[0] < duration) {
        return [];
    }
    let result = [];
    for (let index = 0; index < 3; index++) {
        let workingTime = [workingHoursInMinute[0] + index * minutesInDay,
            workingHoursInMinute[1] + index * minutesInDay];
        let preRes = getGoodSector(freeSectors, workingTime, duration);
        if (typeof preRes !== 'undefined' && preRes.length !== 0) {
            result.push(preRes);
        }
    }

    return result;
}

/* function invalid(element, workingTime, sector) {
    if (element[0] > workingTime[0] + minutesInDay || element[1] > workingTime[1] + minutesInDay) {
        return sector;
    }

    return 1;
}*/

function firstCheck(element, workingTime) {
    let sector;

    /* let preRes = invalid(element, workingTime, sector);
    if (typeof preRes === 'undefined') {
        return sector;
    }*/
    if (workingTime[0] <= element[0] && element[1] <= workingTime[1]) {
        sector = [element[0], element[1]];
    }
    if (workingTime[0] >= element[0] && workingTime[1] <= element[1]) {
        sector = [workingTime[0], workingTime[1]];
    }

    return sector;
}

function secondCheck(element, workingTime) {
    let sector;
    if (workingTime[0] <= element[0] && workingTime[1] >= element[0]) {
        sector = [element[0], workingTime[1]];
    }
    if (workingTime[0] >= element[0] && workingTime[1] >= element[1]) {
        sector = [workingTime[0], element[1]];
    }

    return sector;
}

function getGoodSector(freeSectors, workingTime, duration) {
    let result = [];
    let sector;
    for (let element of freeSectors) {
        sector = firstCheck(element, workingTime);
        if (typeof sector === 'undefined') {
            sector = secondCheck(element, workingTime);
        }
        console.info(sector);
        if (typeof sector !== 'undefined' && sector.length !== 0 &&
        sector[1] - sector[0] >= duration) {
            result.push(sector);
        }
    }

    return result;
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

    /* duration = 151;
    workingHours.from = '00:00+5';
    workingHours.to = '08:00+5';
    schedule = {
        Danny: [
            { from: 'ПН 00:00+5', to: 'СР 00:00+5' }
        ],
        Rusty: [
            { from: 'ПН 11:30+5', to: 'ПН 16:30+5' }
        ],
        Linus: [
            { from: 'СР 09:30+3', to: 'СР 15:00+3' }
        ]
    };*/
    let busyDates = []; // Когда заняты
    for (let key of Object.keys(schedule)) {
        schedule[key].forEach(element => {
            busyDates.push(convertToMinute(element, workingHours));
        });
    }
    let workingHoursInMinute = convertToMinute(workingHours, workingHours);
    let combinedDates = [];
    busyDates.sort((a, b) => {
        return a[0] - b[0];
    });
    busyDates.forEach(element => {
        element = mergeIntersections(element, busyDates);
        if (element.length !== 0) {
            combinedDates.push(element);
        }
    });
    // тут тупа вывод для меня
    combinedDates.forEach(element => {
        console.info(element);
    });
    let freeSectors = getFreeSectors(combinedDates, duration);
    console.info(freeSectors);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            goodSectors = getGoodSectors(freeSectors, workingHoursInMinute, duration);
            console.info('kek');
            console.info(goodSectors);
            if (goodSectors.length !== 0) {
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
            if (goodSectors.length === 0) {
                return '';
            }
            let day = getAnswer(goodSectors[0][0][0], minutesInDay);
            let timeWithoutDays = goodSectors[0][0][0] - day * minutesInDay;
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

function getAnswer(time, divider) {
    return Math.floor(time / divider);
}

function toTwoElement(element) {
    element = element.toString();
    if (element.length === 1) {
        return '0' + element;
    }

    return element;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

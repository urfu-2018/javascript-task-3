'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const minutesInHour = 60;
const minutesInDay = 1440;

function convertToMinute(element, workingHours) {
    const from = convert(element.from, workingHours);
    const to = convert(element.to, workingHours);

    return [from, to];
}

// Работает для даты работы банка и дат расписания(без проверок)
function convert(date, workingHours) {
    let scheduleInMinute = 0;
    const hoursAndMinutes = date.match(/\d{2}[:]\d{2}/);
    const str = hoursAndMinutes[0].split(':');

    scheduleInMinute += parseInt(getWeekDayTime(date)) * minutesInDay;
    scheduleInMinute += parseInt(str[0]) * minutesInHour;
    scheduleInMinute += parseInt(str[1]);
    const timeZone = getTimeZone(date);
    scheduleInMinute += parseInt(removeTimeZone(timeZone, workingHours)) * minutesInHour;
    date = scheduleInMinute;

    return date;
}

function getWeekDayTime(date) {
    if (!/[А-Я]{2}/.test(date)) {
        return 0;
    }

    const weekDay = date.match(/[А-Я]{2}/);

    for (let index = 0; index < weekDays.length; index++) {
        if (weekDay[0] === weekDays[index]) {
            return index;
        }
    }
}

function getTimeZone(date) {
    return date.match(/\+\w{1,2}/)[0].slice(1);
}

// Добавляем или вычитаем часовой пояс в зависимости от часового пояса банка
function removeTimeZone(timeZone, workingHours) {
    const bankTimeZone = getTimeZone(workingHours.from);

    return bankTimeZone - timeZone;
}

function mergeIntersections(sector, busyDates) {
    let preResult = [1, 0];// 1 просто так, 0 ложное значение для первой проверки

    for (let index = busyDates.indexOf(sector); index < busyDates.length; index++) {
        if (preResult[1]) { // если мы дошли до отрезка который не входит в текущий,
            // то значит и все остальные тоже лишние (sort)
            break;
        }

        if (sector === busyDates[index] || busyDates[index].length !== 2) {
            continue;
        }
        preResult = toCombine(sector, busyDates[index], preResult[1]);
        sector = preResult[0];

        if (!preResult[1]) {
            delete busyDates[index];
        }
    }

    return sector;
}

function toCombine(sector, sector2, flag) {
    if (sector[0] <= sector2[0] && sector2[0] <= sector[1]) {
        if (sector2[1] > sector[1]) {
            sector[1] = sector2[1];
        }

        return [sector, flag];
    }

    if (sector[0] <= sector2[1] && sector2[1] <= sector[1]) {
        sector[0] = sector2[0];

        return [sector, flag];
    }
    flag = true;

    return [sector, flag];
}

function getFreeSectors(combinedDates, duration) {
    const result = [];
    let lastTo = 0;

    for (let sector of combinedDates) {
        let preRes = hasFreeSectors(sector, lastTo, duration);

        if (preRes.freeSectors) {
            result.push(preRes.freeSectors);
        }
        lastTo = preRes.lastTo;

        if (lastTo > minutesInDay * 3) {
            return result;
        }
    }

    if (lastTo < minutesInDay * 3) {
        result.push([lastTo, minutesInDay * 3 - 1]); // -1 чтобы не учитывать 24:00 в среду
    }

    return result;
}

function hasFreeSectors(sector, lastTo, duration) {
    let result;

    if (sector[0] - lastTo >= duration) {
        result = [lastTo, sector[0]];
    }
    lastTo = sector[1];

    return {
        freeSectors: result,
        lastTo: lastTo
    };
}

function getGoodSectors(freeSectors, workingHoursInMinute, duration) {
    if (workingHoursInMinute[1] - workingHoursInMinute[0] < duration) {
        return [];
    }

    let result = [];

    for (let index = 0; index < 3; index++) {
        const workingTime = [workingHoursInMinute[0] + index * minutesInDay,
            workingHoursInMinute[1] + index * minutesInDay];

        result = getGoodSector(freeSectors, workingTime, duration, result);
    }

    return result;
}

function firstCheck(element, workingTime) {
    let sector;

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

function getGoodSector(freeSectors, workingTime, duration, result) {
    let sector;

    for (let element of freeSectors) {
        sector = firstCheck(element, workingTime);

        if (!sector) {
            sector = secondCheck(element, workingTime);
        }

        if (sector && sector[1] - sector[0] >= duration) {
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
    const busyDates = []; // Когда заняты

    for (let key of Object.keys(schedule)) {
        schedule[key].forEach(sector => {
            busyDates.push(convertToMinute(sector, workingHours));
        });
    }

    const workingHoursInMinute = convertToMinute(workingHours, workingHours);
    let combinedDates = [];

    busyDates.sort((a, b) => {
        return a[0] - b[0];
    });

    busyDates.forEach(sector => {
        sector = mergeIntersections(sector, busyDates);

        if (sector.length !== 0) {
            combinedDates.push(sector);
        }
    });
    const freeSectors = getFreeSectors(combinedDates, duration);
    const goodSectors = getGoodSectors(freeSectors, workingHoursInMinute, duration);
    let allGoodSectors = {
        allGoodSectorsInDay: []
    };

    // находим отрезки через полчаса относительно подходящих
    for (let sector of goodSectors) {
        allGoodSectors = addAllTrue(sector, duration, allGoodSectors);
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return goodSectors.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (allGoodSectors.allGoodSectorsInDay.length === 0) {
                return '';
            }

            const day = getAnswer(allGoodSectors.allGoodSectorsInDay[0][0], minutesInDay);
            const timeWithoutDays = allGoodSectors.allGoodSectorsInDay[0][0] - day * minutesInDay;
            const hour = getAnswer(timeWithoutDays, minutesInHour);
            const timeWithoutHours = timeWithoutDays - hour * minutesInHour;
            const minute = timeWithoutHours;

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
            if (allGoodSectors.allGoodSectorsInDay.length > 1) {
                allGoodSectors.allGoodSectorsInDay.shift();

                return true;
            }

            return false;
        }
    };
}

function addAllTrue(sector, duration, allGoodSectors) {
    const newSector = [sector[0], sector[1]];

    while (newSector[0] + duration <= sector[1]) {
        const preResultSector = [newSector[0], newSector[0] + duration];
        let resultSector = firstCheck(preResultSector, newSector);
        if (!resultSector) {
            resultSector = secondCheck(preResultSector, newSector);
        }
        if (resultSector) {
            allGoodSectors.allGoodSectorsInDay.push(resultSector);
        }
        newSector[0] += 30;
    }

    return allGoodSectors;
}

function getAnswer(time, divider) {
    return Math.floor(time / divider);
}

function toTwoElement(element) {
    return element.toString().length === 1 ? '0' + element : element;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

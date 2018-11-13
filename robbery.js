'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const minutesInHour = 60;
const minutesInDay = 24 * minutesInHour;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const datesWhenTheyBusy = []; // Когда заняты

    for (let key of Object.keys(schedule)) {
        schedule[key].forEach(busyDate => {
            datesWhenTheyBusy.push(convertToMinutes(busyDate, workingHours));
        });
    }

    const workingHoursInMinute = convertToMinutes(workingHours, workingHours);
    const combinedBusyDates = [];

    datesWhenTheyBusy.sort((a, b) => {
        return a.from - b.from;
    });

    datesWhenTheyBusy.forEach(busySectorOfTime => {
        const combinedBusySector = mergeIntersectingDates(busySectorOfTime, datesWhenTheyBusy);

        if (combinedBusySector.length !== 0) {
            combinedBusyDates.push(combinedBusySector);
        }
    });
    const freeDates = getFreeDates(combinedBusyDates, duration);
    const goodDates = getGoodDates(freeDates, workingHoursInMinute, duration);
    let allGoodDates = [];

    // находим отрезки через полчаса относительно подходящих
    for (let goodSector of goodDates) {
        allGoodDates = getAllGoodDates(goodSector, duration, allGoodDates);
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return goodDates.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (allGoodDates.length === 0) {
                return '';
            }

            const day = roundDown(allGoodDates[0].from, minutesInDay);
            const timeWithoutDays = allGoodDates[0].from - day * minutesInDay;
            const hour = roundDown(timeWithoutDays, minutesInHour);
            const timeWithoutHours = timeWithoutDays - hour * minutesInHour;
            const minute = timeWithoutHours;

            return template
                .replace('%DD', weekDays[day])
                .replace('%HH', digitsToTwoElement(hour))
                .replace('%MM', digitsToTwoElement(minute));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (allGoodDates.length > 1) {
                allGoodDates.shift();

                return true;
            }

            return false;
        }
    };
}

function getAllGoodDates(goodSector, duration, allGoodDates) {
    const workTimeSector = { from: goodSector.from, to: goodSector.to };

    while (workTimeSector.from + duration <= goodSector.to) {
        const preResultSector = { from: workTimeSector.from, to: workTimeSector.from + duration };
        let resultSector;
        resultSector = getIntersectionOrNull(preResultSector, workTimeSector, resultSector);
        if (!resultSector) {
            resultSector = getIntersectionOrNull1(preResultSector, workTimeSector, resultSector);
        }
        if (resultSector) {
            allGoodDates.push(resultSector);
        }
        workTimeSector.from += 30;
    }

    return allGoodDates;
}

function roundDown(time, divider) {
    return Math.floor(time / divider);
}

function digitsToTwoElement(number) {
    return number.toString().length === 1 ? '0' + number : number;
}

function convertToMinutes(busyDate, workingHours) {
    return {
        from: convertTimeIntervalToMinutes(busyDate.from, workingHours),
        to: convertTimeIntervalToMinutes(busyDate.to, workingHours)
    };
}

// Работает для даты работы банка и дат расписания(без проверок)
function convertTimeIntervalToMinutes(date, workingHours) {
    let dateInMinutes = 0;
    const time = date.match(/\d{2}:\d{2}/)[0].split(':');
    const [hours, minutes] = time;
    const timeZone = getTimeZone(date);

    dateInMinutes += getWeekDay(date) * minutesInDay;
    dateInMinutes += hours * minutesInHour;
    dateInMinutes += parseInt(minutes);
    dateInMinutes += getTimeZoneShift(timeZone, workingHours) * minutesInHour;

    return dateInMinutes;
}

function getWeekDay(date) {
    if (!/[А-Я]{2}/.test(date)) {
        return 0;
    }

    const currentWeekDay = date.match(/[А-Я]{2}/)[0];

    return weekDays.findIndex(weekDay => weekDay === currentWeekDay);
}

function getTimeZone(date) {
    return date.match(/\+(\d{1,2})/)[1];
}

// Добавляем или вычитаем часовой пояс в зависимости от часового пояса банка
function getTimeZoneShift(timeZone, workingHours) {
    const bankTimeZone = getTimeZone(workingHours.from);

    return bankTimeZone - timeZone;
}

function mergeIntersectingDates(busySectorOfTime, datesWhenTheyBusy) {
    let intersection = true;

    for (let index = datesWhenTheyBusy.indexOf(busySectorOfTime);
        index < datesWhenTheyBusy.length; index++) {

        if (busySectorOfTime.from === datesWhenTheyBusy[index].from &&
            busySectorOfTime.to === datesWhenTheyBusy[index].to) {
            continue;
        }

        [busySectorOfTime, intersection] = combineBusySectors(busySectorOfTime,
            datesWhenTheyBusy[index], intersection);

        if (!intersection) {
            break;
        }
        delete datesWhenTheyBusy[index];
    }

    return busySectorOfTime;
}

const checkIntersection = (busySectorOfTime, busySectorOfTime1) => {
    return busySectorOfTime.from <= busySectorOfTime1.from &&
        busySectorOfTime1.from <= busySectorOfTime.to;
};
const checkIntersection1 = (busySectorOfTime, busySectorOfTime1) => {
    return busySectorOfTime.from <= busySectorOfTime1.to &&
        busySectorOfTime1.to <= busySectorOfTime.to;
};
const checkIntersection2 = (freeSector, workingTime) => {
    return workingTime.from <= freeSector.from && freeSector.to <= workingTime.to;
};
const checkIntersection3 = (freeSector, workingTime) => {
    return workingTime.from >= freeSector.from && workingTime.to <= freeSector.to;
};
const checkIntersection4 = (freeSector, workingTime) => {
    return workingTime.from <= freeSector.from && workingTime.to >= freeSector.from;
};
const checkIntersection5 = (freeSector, workingTime) => {
    return workingTime.from >= freeSector.from && workingTime.to >= freeSector.to;
};

function combineBusySectors(busySectorOfTime, busySectorOfTime1, intersection) {
    if (checkIntersection(busySectorOfTime, busySectorOfTime1)) {
        if (busySectorOfTime1.to > busySectorOfTime.to) {
            busySectorOfTime.to = busySectorOfTime1.to;
        }

        return [busySectorOfTime, intersection];
    }

    if (checkIntersection1(busySectorOfTime, busySectorOfTime1)) {
        busySectorOfTime.from = busySectorOfTime1.from;

        return [busySectorOfTime, intersection];
    }
    intersection = false;

    return [busySectorOfTime, intersection];
}

function getFreeDates(combinedBusyDates, duration) {
    const allFreeSectors = [];
    let lastTo = 0;

    for (let date of combinedBusyDates) {
        const newFreeSectors = getFreeSectors(date, lastTo, duration);

        if (newFreeSectors.freeSectors) {
            allFreeSectors.push(newFreeSectors.freeSectors);
        }
        lastTo = newFreeSectors.lastTo;

        if (lastTo > minutesInDay * 3) {
            return allFreeSectors;
        }
    }

    if (lastTo < minutesInDay * 3) {
        allFreeSectors.push({
            from: lastTo,
            to: minutesInDay * 3 - 1
        }); // -1 чтобы не учитывать 24:00 в среду
    }

    return allFreeSectors;
}

function getFreeSectors(date, lastTo, duration) {
    let result;

    if (date.from - lastTo >= duration) {
        result = {
            from: lastTo,
            to: date.from
        };
    }

    lastTo = date.to;

    return {
        freeSectors: result,
        lastTo: lastTo
    };
}

function getGoodDates(freeDates, workingHoursInMinute, duration) {
    if (workingHoursInMinute.to - workingHoursInMinute.from < duration) {
        return [];
    }

    let result = [];
    for (let index = 0; index < 3; index++) {
        const workingTime = {
            from: workingHoursInMinute.from + index * minutesInDay,
            to: workingHoursInMinute.to + index * minutesInDay
        };
        result = getGoodSector(freeDates, workingTime, duration, result);
    }

    return result;
}

function getIntersectionOrNull(freeSector, workingTime, goodSector) {

    if (checkIntersection2(freeSector, workingTime)) {
        goodSector = { from: freeSector.from, to: freeSector.to };
    }

    if (checkIntersection3(freeSector, workingTime)) {
        goodSector = { from: workingTime.from, to: workingTime.to };
    }

    return goodSector;
}

function getIntersectionOrNull1(freeSector, workingTime, goodSector) {

    if (checkIntersection4(freeSector, workingTime)) {
        goodSector = { from: freeSector.from, to: workingTime.to };
    }

    if (checkIntersection5(freeSector, workingTime)) {
        goodSector = { from: workingTime.from, to: freeSector.to };
    }

    return goodSector;
}

function getGoodSector(freeDates, workingTime, duration, result) {

    for (let freeSector of freeDates) {
        let goodSector;

        goodSector = getIntersectionOrNull(freeSector, workingTime, goodSector);

        if (!goodSector) {
            goodSector = getIntersectionOrNull1(freeSector, workingTime, goodSector);
        }
        if (goodSector && goodSector.to - goodSector.from >= duration) {
            result.push(goodSector);
        }
    }

    return result;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

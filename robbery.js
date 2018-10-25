'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const DAYS_OF_THE_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;

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

    // Преобразовать расписание грабителей в интервалы в терминах минут
    const robberIntervals = getRobberIntervals(schedule);

    // Найти моменты времени, когда ни один из грабителей не занят
    const freeIntervals = findFreeIntervals(robberIntervals);

    // Преобразовать расписание банка в интервал
    const bankWorkingInterval = getBankWorkingInterval(bankWorkingHours);

    // Найти пересечение рабочих часов банка и свободного времени грабителей
    const overlaps = findAllOverlaps(freeIntervals, bankWorkingInterval);

    return makeAppropriateMomentObject(overlaps);
}

/*
 * Преобразовывает расписание грабителей в массив временных интервалов
 */
function getRobberIntervals(schedule) {

    const busyIntervals = [];

    for (let robber of schedule) {
        for (let busyHours of robber) {
            const from = parseScheduleTime(busyHours.from);
            const to = parseScheduleTime(busyHours.to);

            busyIntervals.push(createInterval(from, to));
        }
    }
}

/*
 * Преобразует описывающую время строку в расписании грабителей в количество минут с начала недели
 */
function parseScheduleTime(input) {

    const components = busyHours.split(' ');
    const weekday = DAYS_OF_THE_WEEK.indexOf(components[0]);
    const minutes = parseMinutes(components[1]);

    return (weekday * HOURS_IN_DAY * MINUTES_IN_HOUR + minutes);
}

/*
 * Парсит количество минут с начала дня из строки вида "10:00+5"
 */
function parseMinutes(input) {

}

/*
 * Находит промежутки времени, когда все грабители свободны
 */
function findFreeIntervals(robberIntervals) {

    // Для корректной работы алгоритма требуется отсортировать массив
    // в порядке возрастания
    robberIntervals.sort(compareIntervals);

    const freeIntervals = [];

    // Если грабители не заняты в начале недели,
    // добавить этот период в список свободных
    if (robberIntervals[0].from > 0) {
        freeIntervals.push(createInterval(0, robberIntervals[0].from - 1));
    }

    // Поиск всех свободных интервалов между занятыми интервалами
    let maxTo = robberIntervals[0].to;
    for (let i = 1; i < robberIntervals.length; i++) {
        const thisInterval = robberIntervals[i];

        if (maxTo < thisInterval.from) {
            freeIntervals.push(createInterval(maxTo + 1, thisInterval.from - 1));
        }
        
        if (maxTo < thisInterval.to) {
            maxTo = thisInterval.to;
        }
    }

    // Если в конце недели остаётся свободное время, добавить соответствующий интервал
    const END_OF_THE_WEEK = MINUTES_IN_HOUR * HOURS_IN_DAY * DAYS_OF_THE_WEEK.length - 1;
    if (maxTo < END_OF_THE_WEEK) {
        freeIntervals.push(createInterval(maxTo + 1, END_OF_THE_WEEK));
    }

    return freeIntervals;
}

function createInterval(from, to) {

    return {
        from,
        to
    };
}

/*
 * Сравнение интервалов по возрастанию
 */
function compareIntervals(a, b) {
    if (a.from < b.from) {
        return -1;
    }
    else if (a.from > b.from) {
        return 1;
    }
    else if (a.to < b.to) {
        return -1;
    }
    else if (a.to > b.to) {
        return 1;
    }
    else return 0;
}

/*
 * Получить рабочий интервал банка
 */
function getBankWorkingInterval(bankWorkingHours) {

    const from = parseMinutes(bankWorkingHours.from);
    const to = parseMinutes(bankWorkingHours.to) - 1;

    return createInterval(from, to);
}

/*
 * Найти пересечение свободного времени грабителей и рабочих часов банка до четверга
 */
function findAllOverlaps(freeIntervals, bankWorkingInterval) {

    const overlaps = [];
    for (let i = 0; i < daysOfTheWeek.indexOf('ЧТ'); i++) {
        const bankHoursToday = getBankHoursForDay(bankWorkingInterval, i);
        const overlapsToday = findOverlapsForDay(freeIntervals, bankHoursToday);
        overlaps.concat(overlapsToday);
    }

    return overlaps;
}

/*
 * Найти интервал, соответствующий рабочим часам банка в конкретный день
 */
function getBankHoursForDay(bankWorkingInterval, weekday) {

    const otherDaysMinutes = weekday * MINUTES_IN_HOUR * HOURS_IN_DAY;
    const from = otherDaysMinutes + bankWorkingInterval.from;
    const to = otherDaysMinutes + bankWorkingInterval.to;

    return createInterval(from, to);
}

/*
 * Найти пересечение свободного времени грабителей и рабочих часов банка
 * в конкретный день
 */
function findOverlapsForDay(freeIntervals, bankWorkingInterval) {

    const overlaps = [];

    for (let i = 0; i < freeIntervals.length; i++) {
        const currentInterval = freeIntervals[i];

        // Если интервал закончился раньше начала работы банка
        // или начался позже завершения работы банка,
        // не рассматриваем его
        if (currentInterval.to < bankWorkingInterval.from) {
            continue;
        }

        // Найти границы интервала-пересечения
        const from = Math.max(currentInterval.from, bankWorkingInterval.from);
        const to = Math.min(currentInterval.to, bankWorkingInterval.to);

        overlaps.push(createInterval(from, to));
    }

    return overlaps;
}

function makeAppropriateMomentObject(overlaps) {

    // Найти подходящий для ограбления момент
    appropriateMoment = findAppropriateMoment(overlaps);

    return {
        overlaps,
        appropriateMoment,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return template;
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

function findAppropriateMoment(overlaps) {
    for (let interval of overlaps) {
        if (interval.to - interval.from >= duration) {
            return interval.from;
        }
    }
}

module.exports = {
    getAppropriateMoment,

    isStar
};

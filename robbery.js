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

    // Узнать часовой пояс банка
    const bankTimezone = getBankTimezone(workingHours);

    // Преобразовать расписание грабителей в интервалы
    const robberIntervals = getBusyIntervals(schedule, bankTimezone);

    // Найти временные интервалы, когда ни один из грабителей не занят
    const freeIntervals = findFreeIntervals(robberIntervals);

    // Преобразовать расписание банка в интервал
    const bankWorkingInterval = getBankWorkingInterval(workingHours);

    // Найти пересечение рабочих часов банка и свободного времени грабителей
    // на протяжении всей недели
    const overlaps = findOverlapsForWeek(freeIntervals, bankWorkingInterval);

    // Найти подходящий для ограбления момент
    const appropriateMoment = findAppropriateMoment(overlaps, duration);

    return makeResult(duration, overlaps, appropriateMoment);
}

/*
 * Узнать часовой пояс банка
 */
function getBankTimezone(workingHours) {

    return Number.parseInt(workingHours.from.substr(workingHours.from.indexOf('+') + 1));
}

/*
 * Преобразовывает расписание грабителей в массив временных интервалов
 */
function getBusyIntervals(schedule, bankTimezone) {

    let busyIntervals = [];

    for (let robber of Object.keys(schedule)) {
        for (let busyHours of schedule[robber]) {
            const from = parseScheduleTime(busyHours.from, bankTimezone);
            const to = parseScheduleTime(busyHours.to, bankTimezone);

            busyIntervals.push(createInterval(from, to));
        }
    }

    return busyIntervals;
}

/*
 * Преобразует описывающую время строку в расписании грабителей в количество минут с начала недели
 */
function parseScheduleTime(input, bankTimezone) {

    const components = input.split(' ');
    const weekday = DAYS_OF_THE_WEEK.indexOf(components[0]);
    const minutes = parseMinutes(components[1], bankTimezone);

    return (weekday * HOURS_IN_DAY * MINUTES_IN_HOUR + minutes);
}

/*
 * Парсит количество минут с начала дня из строки вида "10:00+5"
 */
function parseMinutes(input, bankTimezone) {

    const inputComponents = input.split(/:|\+/);

    const hour = Number.parseInt(inputComponents[0]);
    const minute = Number.parseInt(inputComponents[1]);
    const timezone = Number.parseInt(inputComponents[2]);

    return (hour + bankTimezone - timezone) * MINUTES_IN_HOUR + minute;
}

/*
 * Находит промежутки времени, когда все грабители свободны
 */
function findFreeIntervals(robberIntervals) {

    // Если грабители никогда не заняты, они всегда свободны :)
    if (robberIntervals.length === 0) {
        return [createInterval(0, DAYS_OF_THE_WEEK.length * HOURS_IN_DAY * MINUTES_IN_HOUR - 1)];
    }

    // Для корректной работы алгоритма требуется отсортировать массив
    // в порядке возрастания
    robberIntervals.sort(compareIntervals);

    let freeIntervals = [];

    // Если грабители не заняты в начале недели,
    // добавить этот период в список свободных
    if (robberIntervals[0].from > 0) {
        freeIntervals.push(createInterval(0, robberIntervals[0].from));
    }

    // Поиск всех свободных интервалов между занятыми интервалами
    let maxTo = robberIntervals[0].to;
    for (let i = 1; i < robberIntervals.length; i++) {
        if (maxTo < robberIntervals[i].from) {
            freeIntervals.push(createInterval(maxTo + 1, robberIntervals[i].from));
        }
        maxTo = Math.max(maxTo, robberIntervals[i].to - 1);
    }

    // Если в конце недели остаётся свободное время, добавить соответствующий интервал
    const END_OF_THE_WEEK = MINUTES_IN_HOUR * HOURS_IN_DAY * DAYS_OF_THE_WEEK.length - 1;
    if (maxTo < END_OF_THE_WEEK) {
        freeIntervals.push(createInterval(maxTo + 1, END_OF_THE_WEEK));
    }

    return freeIntervals;
}

/*
 * Создать объект, представляющий интервал
 */
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
    } else if (a.from > b.from) {
        return 1;
    } else if (a.to < b.to) {
        return -1;
    } else if (a.to > b.to) {
        return 1;
    }

    return 0;
}

/*
 * Получить рабочий интервал банка
 */
function getBankWorkingInterval(bankWorkingHours) {

    const bankTimezone = getBankTimezone(bankWorkingHours);

    const from = parseMinutes(bankWorkingHours.from, bankTimezone);
    const to = parseMinutes(bankWorkingHours.to, bankTimezone);

    return createInterval(from, to);
}

/*
 * Найти пересечение свободного времени грабителей и рабочих часов банка до четверга
 */
function findOverlapsForWeek(freeIntervals, bankWorkingInterval) {

    let overlaps = [];
    for (let i = 0; i < DAYS_OF_THE_WEEK.indexOf('ЧТ'); i++) {
        const bankHoursToday = getBankHoursForDay(bankWorkingInterval, i);
        const overlapsToday = findOverlapsForDay(freeIntervals, bankHoursToday);
        overlaps = overlaps.concat(overlapsToday);
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

    let overlaps = [];

    for (let i = 0; i < freeIntervals.length; i++) {
        const currentInterval = freeIntervals[i];

        // Если интервал закончился раньше начала работы банка
        // или начался позже завершения работы банка,
        // не рассматриваем его
        if (currentInterval.to < bankWorkingInterval.from ||
            currentInterval.from > bankWorkingInterval.to) {
            continue;
        }

        // Найти границы интервала-пересечения
        const from = Math.max(currentInterval.from, bankWorkingInterval.from);
        const to = Math.min(currentInterval.to, bankWorkingInterval.to);

        overlaps.push(createInterval(from, to));
    }

    return overlaps;
}

function makeResult(duration, overlaps, appropriateMoment) {

    return {
        duration,
        overlaps,
        appropriateMoment,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return this.appropriateMoment !== undefined;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {

            if (this.appropriateMoment === undefined) {
                return '';
            }

            const day = Math.trunc(this.appropriateMoment / (MINUTES_IN_HOUR * HOURS_IN_DAY));
            const hour = Math.trunc(this.appropriateMoment / MINUTES_IN_HOUR) % HOURS_IN_DAY;
            const minute = this.appropriateMoment % MINUTES_IN_HOUR;

            return template.replace('%HH', toTwoDigitString(hour))
                .replace('%MM', toTwoDigitString(minute))
                .replace('%DD', DAYS_OF_THE_WEEK[day]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {

            const TIME_DIFFERENCE = 30;
            const beginFrom = this.appropriateMoment + TIME_DIFFERENCE;
            const newMoment = findAppropriateMoment(overlaps, duration, beginFrom);

            if (newMoment === undefined) {
                return false;
            }

            this.appropriateMoment = newMoment;

            return true;
        }
    };
}

/*
 * Найти начало интервала длины, достигающей необходимой (с учётом нижней границы),
 * если такой имеется
 */
function findAppropriateMoment(overlaps, duration, beginFrom) {
    for (let interval of overlaps) {
        let lowerBoundary = interval.from;
        if (beginFrom !== undefined) {
            lowerBoundary = Math.max(interval.from, beginFrom);
        }
        if (interval.to - lowerBoundary >= duration) {
            return lowerBoundary;
        }
    }
}

/*
 * Преобразовать число в строку из двух цифр
 */
function toTwoDigitString(number) {

    let numberString = number.toString();

    if (numberString.length === 1) {
        numberString = '0' + numberString;
    }

    return numberString;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

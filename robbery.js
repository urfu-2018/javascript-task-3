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
function getAppropriateMoment(schedule, duration, workingHours) {
    // рабочее время банка в виде массива интервалов со значениями в виде timestamp'а
    const WORKING_HOURS = getWorkingHoursIntervals(workingHours);

    // аналог schedule, но в значениях `from` и `to` не текстовое представление, а timestamp
    const ROBBERS_SCHEDULE = getRobbersScheduleIntervals(schedule);

    // пересечение расписаний и рабочего времени
    let APPROPRIATE_INTERVALS = getAppropriateIntervals(WORKING_HOURS, ROBBERS_SCHEDULE);

    // оставляем только те, что удовлетворяют необходимому времени на ограбление - duration
    APPROPRIATE_INTERVALS = getFilteredByDuration(APPROPRIATE_INTERVALS, duration);

    // получаем массив объектов с подходящими для ограбления моментами времени
    const BANK_TIMEZONE = getTimezone(workingHours.from);
    const ROBBERY_MOMENTS = getRobberyMoments(APPROPRIATE_INTERVALS, duration, BANK_TIMEZONE);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return ROBBERY_MOMENTS.length > 0;
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
            const MOMENT = ROBBERY_MOMENTS[0];

            return template
                .replace('%DD', MOMENT.WEEK_DAY)
                .replace('%HH', MOMENT.HOURS)
                .replace('%MM', MOMENT.MINUTES);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (ROBBERY_MOMENTS.length <= 1) {
                return false;
            }
            ROBBERY_MOMENTS.shift();

            return true;
        }
    };
}

/**
 * Возвращает часовой пояс указанной даты
 * @param {String} date - дата в формате ПН 00:00+3
 * @returns {Number}
 */
function getTimezone(date) {
    return Number(date.replace(/.*?[+-](\d+)$/i, '$1'));
}

const ROBBERY_WEEK_DAYS = ['ПН', 'ВТ', 'СР']; // дни недели, в которые возможно ограбление

/**
 * Возвращает массив объектов-интервалов рабочего времени банка, где полям `from` и `to`
 * соответствует timestamp с началом отсчёта в ПН 00:00+0, а не представление вида ПН 09:00+3
 * @param {Object} workingHours - рабочее время банка
 * @returns {Array}
 */
function getWorkingHoursIntervals(workingHours) {
    return ROBBERY_WEEK_DAYS.map(day => {
        return {
            from: getDateTimestamp(day + ' ' + workingHours.from),
            to: getDateTimestamp(day + ' ' + workingHours.to)
        };
    });
}

const WEEK_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;

/**
 * Возвращает timestamp для указанной даты
 * @param {String} date - дата в формате ПН 00:00+9
 * @returns {Number}
 */
function getDateTimestamp(date) {
    const WEEK_DAY = date.substr(0, 2);
    // значение timestamp'а для указанного дня недели, например, для ВТ это 1 * 24 * 60
    const DAY_BEGINNING = WEEK_DAYS.indexOf(WEEK_DAY) * MINUTES_IN_DAY;
    const HOURS = Number(date.replace(/.*?\s0?(\d+).*/, '$1'));
    const MINUTES = Number(date.replace(/.*?:0?(\d+).*/, '$1'));
    const TIMEZONE = getTimezone(date);

    return DAY_BEGINNING + HOURS * MINUTES_IN_HOUR + MINUTES - TIMEZONE * MINUTES_IN_HOUR;
}

/**
 * Возвращает объект с расписаниями грабителей со значениями `from` и `to` в виде timestamp'а
 * @param {Object} schedule - расписание грабителей
 * @returns {Object}
 */
function getRobbersScheduleIntervals(schedule) {
    const intervalsSchedule = {};
    for (let robberName in schedule) {
        if (!schedule.hasOwnProperty(robberName)) {
            continue;
        }
        intervalsSchedule[robberName] = getScheduleIntervals(schedule[robberName]);
    }

    return intervalsSchedule;
}

const TIMESTAMP_UPPER_LIMIT = WEEK_DAYS.length * MINUTES_IN_DAY - 1;

/**
 * Возвращает массив объектов-интервалов расписания свободного времени грабителя, где
 * полям `from` и `to` соответствует timestamp с началом отсчёта в ПН 00:00+0, а не
 * представление вида ПН 09:00+3
 * @param {Object} schedule - расписание грабителя
 * @returns {Array}
 */
function getScheduleIntervals(schedule) {
    // интервалы занятости грабителя
    const BUSY_INTERVALS = schedule.map(interval => {
        return {
            from: getDateTimestamp(interval.from),
            to: getDateTimestamp(interval.to)
        };
    }).sort(sortComparator);
    // инвертирование интервалов
    if (!BUSY_INTERVALS.length) {
        return [{
            from: 0,
            to: TIMESTAMP_UPPER_LIMIT
        }];
    }
    let previousTo = 0;

    return BUSY_INTERVALS.reduce((accumulator, interval, index, array) => {
        accumulator.push({
            from: previousTo,
            to: interval.from
        });
        if (index === array.length - 1 && interval.to < TIMESTAMP_UPPER_LIMIT) {
            accumulator.push({
                from: interval.to,
                to: TIMESTAMP_UPPER_LIMIT
            });
        }
        previousTo = interval.to;

        return accumulator;
    }, []).sort(sortComparator);
}

/**
 * Возвращает подходящие для ограбления интервалы времени
 * @param {Array} workingHours - массив интервалов рабочего времени банка
 * @param {Object} schedule - расписание грабителей
 * @returns {Array}
 */
function getAppropriateIntervals(workingHours, schedule) {
    let intersection = workingHours.slice();
    for (let robberName in schedule) {
        if (!schedule.hasOwnProperty(robberName)) {
            continue;
        }
        intersection = intersectSchedules(intersection, schedule[robberName]);
    }
    intersection.sort(sortComparator);

    return intersection;
}

/**
 * Возвращает массив с интервалами из пересечения времени работы банка и расписания
 * конкретного грабителя
 * @param {Array} intersection - массив интервалов пересечения расписания банка и грабителей
 * @param {Array} schedule - массив интервалов рабочего времени одного грабителя
 * @returns {Array}
 */
function intersectSchedules(intersection, schedule) {
    let appropriateInterval;

    return intersection.reduce((accumulator, interval) => {
        schedule.forEach(scheduleInterval => {
            appropriateInterval = getIntersection(interval, scheduleInterval);
            if (appropriateInterval) {
                accumulator.push(appropriateInterval);
            }
        });

        return accumulator;
    }, []);
}

/**
 * Возвращает пересечение интервалов
 * @param {Object} first - первый интервал
 * @param {Object} second - Второй интервал
 * @returns {Object|undefined}
 */
function getIntersection(first, second) {
    // нет пересечения
    if (first.from >= second.to || first.to <= second.from) {
        return;
    }
    // пустое пересечение
    if (Math.max(first.from, second.from) === Math.min(first.to, second.to)) {
        return;
    }

    return {
        from: Math.max(first.from, second.from),
        to: Math.min(first.to, second.to)
    };
}

/**
 * Возвращает массив таких интервалов, которые соответствуют продолжительности ограбления
 * @param {Array} intervals - интервалы времени, подходящие для ограбления
 * @param {Number} duration - продолжительность ограбления в минутах
 * @returns {Array}
 */
function getFilteredByDuration(intervals, duration) {
    return intervals.filter(intrval => {
        return intrval.to - intrval.from >= duration;
    });
}

const NEXT_ROBBERY_DELAY = 30; // количество минут, через которое можно снова пойти на ограбление

/**
 * Возвращает массив объектов с информацией о подходящих моментах времени ограбления
 * @param {Array} intervals - интервалы времени, подходящие для ограбления
 * @param {Number} duration - продолжительность ограбления
 * @param {Number} timezone - часовой пояс банка
 * @returns {Array}
 */
function getRobberyMoments(intervals, duration, timezone) {
    let robberyEndsAt; // последний момент времени, когда было выполнено ограбление

    return intervals.reduce((accumulator, interval) => {
        robberyEndsAt = !robberyEndsAt ? interval.from : Math.max(robberyEndsAt, interval.from);
        // запись в массив всех подходящих моментов времени для ограбления
        while (robberyEndsAt + duration <= interval.to) {
            accumulator.push(getRobberyMomentData(robberyEndsAt, timezone));
            robberyEndsAt += NEXT_ROBBERY_DELAY;
        }

        return accumulator;
    }, []);
}

/**
 * Возвращает объект с днем недели, часами и минутами из timestamp'а
 * @param {Number} timestamp - собственный timestamp в скрипте
 * @param {Number} timezone - часовой пояс
 * @returns {Object}
 */
function getRobberyMomentData(timestamp, timezone) {
    timestamp += timezone * MINUTES_IN_HOUR;
    const WEEK_DAY = WEEK_DAYS[Math.floor(timestamp / MINUTES_IN_DAY)];
    timestamp -= WEEK_DAYS.indexOf(WEEK_DAY) * MINUTES_IN_DAY;
    const HOURS = Math.floor(timestamp / MINUTES_IN_HOUR);
    const MINUTES = timestamp % MINUTES_IN_HOUR;

    return {
        WEEK_DAY: WEEK_DAY,
        HOURS: HOURS < 10 ? '0' + HOURS : HOURS,
        MINUTES: MINUTES < 10 ? '0' + MINUTES : MINUTES
    };
}

/**
 * Comparator сортировки массива интервалов
 * @param {Object} first
 * @param {Object} second
 * @returns {Number}
 */
function sortComparator(first, second) {
    if (first.from === second.from) {
        return 0;
    }

    return first.from < second.from ? -1 : 1;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

/**
 * Парсит время из строки
 * @param {String} time - Время формата "10:00+5"
 * @returns {[Number]} - Массив [Часы, Минуты, Часовой пояс]
 */
function parseTime(time) {
    const timePattern = /^(\d\d):(\d\d)\+(\d+)$/;
    const [, hours, minutes, timeZone] = time.match(timePattern);

    return [hours, minutes, timeZone].map(val => Number(val));
}

/**
 * Перевести время в минуты
 * @param {String} day - День недели
 * @param {Number} hours - Часы
 * @param {Number} minutes - Минуты
 * @param {Number} timeZone - Часовой пояс
 * @returns {Number} - Время в минутах
 */
function getTimeInMinutes(day, hours, minutes, timeZone = 0) {
    const days = {
        'ПН': 0,
        'ВТ': 24 * 60,
        'СР': 48 * 60
    };

    return days[day] + hours * 60 + minutes - timeZone * 60;
}

/**
 * Получить интервал работы банка в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {[Object]} - Массив интервалов
 */
function getBankWorkingIntervals(workingHours) {
    const [hoursFrom, minutesFrom, timeZone] = parseTime(workingHours.from);
    const [hoursTo, minutesTo] = parseTime(workingHours.to);

    return [['ПН', 'ВТ', 'СР'].map(day => {
        return {
            from: getTimeInMinutes(day, hoursFrom, minutesFrom),
            to: getTimeInMinutes(day, hoursTo, minutesTo)
        };
    }), timeZone];
}

/**
 * Переведит расписание банды в массив интервалов в минутах
 * @param {Object} schedule - Расписание банды
 * @param {Number} bankTimeZone - Часовой пояс банка
 * @returns {[Object]} - Массив интервало
 */
function getIntervalsFromSchedule(schedule, bankTimeZone) {
    return Object.values(schedule)
        .reduce((acc, interval) => acc.concat(interval), [])
        .map(interval => {
            const [dayFrom, timeFrom] = interval.from.split(' ');
            const [hoursFrom, minutesFrom, timeZone] = parseTime(timeFrom);
            const [dayTo, timeTo] = interval.to.split(' ');
            const [hoursTo, minutesTo] = parseTime(timeTo);

            return {
                from: getTimeInMinutes(dayFrom, hoursFrom, minutesFrom, timeZone - bankTimeZone),
                to: getTimeInMinutes(dayTo, hoursTo, minutesTo, timeZone - bankTimeZone)
            };
        })
        .sort((interval1, interval2) => interval1.from - interval2.from);
}

/**
 * Объединяет пересекающие интервали
 * @param {[Object]} intervals - Начальные интервалы
 * @returns {[Object]} - Объединенные интревалы
 */
function unionIntervals(intervals) {
    const newIntervals = [intervals[0]];
    let lastInterval = newIntervals[newIntervals.length - 1];

    intervals.forEach(interval => {
        if (lastInterval.from >= interval.to || lastInterval.to <= interval.from) {
            newIntervals.push(interval);
            lastInterval = interval;
        } else {
            lastInterval.to = Math.max(lastInterval.to, interval.to);
        }
    });

    return newIntervals;
}

/**
 * Получает свободные интервалы в расписании Банды
 * @param {[Object]} intervals - Массив интервалов
 * @returns {[Object]} - Свободные интревали
 */
function getFreeIntervals(intervals) {
    const lastTime = getTimeInMinutes('СР', 23, 59);
    let startTime = 0;
    const freeIntervals = intervals.reduce((acc, interval) => {
        const endTime = interval.from;
        acc.push({
            from: startTime,
            to: endTime < lastTime ? endTime : lastTime
        });
        startTime = interval.to;

        return acc;
    }, []);

    if (startTime < lastTime) {
        freeIntervals.push({
            from: startTime,
            to: lastTime
        });
    }

    return freeIntervals;
}

/**
 * Вычисляет возможные интревалы для ограбления
 * @param {[Object]} BankIntervals - Интервалы работы банка
 * @param {[Object]} gangIntervals - Свободные интервали в расписании банды
 * @param {Number} duration - Продолжительность ограбления
 * @returns {[Object]} - Возможные интервалы для ограбления
 */
function getIntervalsForRobbery(BankIntervals, gangIntervals, duration) {
    return BankIntervals.reduce((acc, bankInterval) => {
        gangIntervals.forEach(gangInterval => {
            if (bankInterval.from < gangInterval.to && bankInterval.to > gangInterval.from) {
                const robberyInterval = {
                    from: Math.max(bankInterval.from, gangInterval.from),
                    to: Math.min(bankInterval.to, gangInterval.to)
                };

                if (robberyInterval.to - robberyInterval.from >= duration) {
                    acc.push(robberyInterval);
                }
            }
        });

        return acc;
    }, []).sort((interval1, interval2) => interval1.from - interval2.from);
}

/**
 * Получает дату из минут
 * @param {Number} minutes - Количество минут
 * @returns {[String]} - Массив вида [День, Часы, Минуты]
 */
function getTimeFromMinutes(minutes) {
    const days = {
        0: 'ПН',
        1: 'ВТ',
        2: 'СР'
    };

    const countOfDay = Math.floor(minutes / (24 * 60));
    const day = days[countOfDay];
    const hours = Math.floor((minutes - countOfDay * 24 * 60) / 60).toString()
        .padStart(2, '0');
    const minute = (minutes - countOfDay * 24 * 60 - hours * 60).toString()
        .padStart(2, '0');

    return [day, hours, minute];
}

function tryFindLeterRobbery(resultIntervals, duration) {
    if (resultIntervals.length === 0) {
        return false;
    }

    let firstInterval = resultIntervals[0];
    if (firstInterval.to - firstInterval.from - 30 >= duration) {
        resultIntervals[0].from += 30;

        return true;
    }

    if (resultIntervals[1]) {
        resultIntervals.shift();

        return true;
    }

    return false;
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
    const [bankWorkingIntervals, bankTimeZone] = getBankWorkingIntervals(workingHours);
    const busyIntervals = unionIntervals(getIntervalsFromSchedule(schedule, bankTimeZone));
    const freeIntervals = getFreeIntervals(busyIntervals);
    const resultIntervals = getIntervalsForRobbery(bankWorkingIntervals, freeIntervals, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (resultIntervals.length > 0) {
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
            if (resultIntervals.length === 0) {
                return '';
            }

            const needingInterval = resultIntervals[0];
            const [day, hours, minutes] = getTimeFromMinutes(needingInterval.from);

            const newTemplate = template.replace('%DD', day).replace('%HH', hours)
                .replace('%MM', minutes);

            return newTemplate;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return tryFindLeterRobbery(resultIntervals, duration);
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

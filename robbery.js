'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const days = ['ПН', 'ВТ', 'СР'];

    const bankSchedule = [
        { from: 'ПН ' + workingHours.from, to: 'ПН ' + workingHours.to },
        { from: 'ВТ ' + workingHours.from, to: 'ВТ ' + workingHours.to },
        { from: 'СР ' + workingHours.from, to: 'СР ' + workingHours.to }
    ];

    const findedTime = findTime(schedule, duration, bankSchedule);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return findedTime !== null;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (findedTime === null) {
                return '';
            }
            const day = days[Math.floor(findedTime / (24 * 60))];
            const hours = Math.floor((findedTime % (24 * 60)) / 60);
            const minutes = findedTime % 60;

            return template
                .replace('%HH', hours < 10 ? '0' + hours : hours)
                .replace('%MM', minutes < 10 ? '0' + minutes : minutes)
                .replace('%DD', day);
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

/**
 * Возвращает подходящее для ограбления время
 * @param {Object} schedule – Расписание банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Array} bankSchedule – Расписание банка
 * @returns {Number|null} - null, если нет подходящего времени
 */
function findTime(schedule, duration, bankSchedule) {
    const times = joinGangAndBankSchedules(schedule, bankSchedule);

    for (let i = 0; i < times.length; i++) {
        const { to, from } = times[i];
        if (to >= from + duration) {
            return from;
        }
    }

    return null;
}

/**
 * Возвращает расписание свободного времени для всех членов банды в рабочие часы банка
 * @param {Object} schedule – Расписание банды
 * @param {Array} bankSchedule – Расписание банка
 * @returns {Array}
 */
function joinGangAndBankSchedules(schedule, bankSchedule) {
    const bankTimeZone = parseInt(bankSchedule[0].from.split('+')[1]);

    const gangSchedules = ['Danny', 'Rusty', 'Linus'].map(name => {
        const scheduleOfGangMember = formatSchedule(schedule[name], bankTimeZone);

        return freeTimeSchedule(scheduleOfGangMember);
    });

    const formattedBankSchedule = formatSchedule(bankSchedule, bankTimeZone);

    let jointSchedule = gangSchedules.reduce((result, currentSchedule) => {
        return result.length
            ? intersectSchedule(result, currentSchedule) : [];
    }, formattedBankSchedule);

    return jointSchedule;
}

/**
 * Возвращает пересечение расписаний двух объектов
 * @param {Array} firstSchedule – Расписание первого объекта
 * @param {Array} secondSchedule - Расписание второго объекта
 * @returns {Array}
 */
function intersectSchedule(firstSchedule, secondSchedule) {
    const intersectedSchedule = [];
    firstSchedule.forEach(firstElem => {
        secondSchedule.forEach(secondElem => {
            const currentSchedule = intersectTimes(firstElem, secondElem);
            if (currentSchedule) {
                intersectedSchedule.push(currentSchedule);
            }
        });
    });

    return intersectedSchedule;
}

/**
 * Возвращает пересечение двух отрезков времени
 * @param {Object} firstSchedule – Первый отрезок времени
 * @param {Object} firstSchedule.from – Начало первого отрезка
 * @param {Object} firstSchedule.to – Конец первого отрезка
 * @param {Object} secondSchedule - Второй отрезок времени
 * @param {Object} secondSchedule.from – Начало второго отрезка
 * @param {Object} secondSchedule.to – Конец второго отрезка
 * @returns {Object|null} - null, если не пересекаются
 */
function intersectTimes(firstSchedule, secondSchedule) {
    return firstSchedule.from > secondSchedule.from
        ? intersectIntervalsFirstLaterSecond(firstSchedule, secondSchedule)
        : intersectIntervalsFirstLaterSecond(secondSchedule, firstSchedule);

    /**
     * Возвращает пересечение двух отрезков, при условии, что начало первого больше начала второго
     * @param {Object} firstInterval – Первый отрезок
     * @param {Object} secondInterval - Второй отрезок
     * @returns {Object|null} - null, если не пересекаются
     */
    function intersectIntervalsFirstLaterSecond(firstInterval, secondInterval) {
        if (firstInterval.from > secondInterval.to) {
            return null;
        }
        if (firstInterval.to > secondInterval.to) {
            return {
                from: firstInterval.from,
                to: secondInterval.to
            };
        }

        return firstInterval;
    }
}

/**
 * Возвращает свободное время члена банды
 * @param {Array} workSchedule - Рабочее время члена банды
 * @returns {Array}
 */
function freeTimeSchedule(workSchedule) {
    let from = 0;
    const freeTimes = [];

    workSchedule.forEach(time => {
        freeTimes.push({
            from,
            to: time.from
        });

        from = time.to;
    });
    freeTimes.push({
        from: workSchedule.length ? workSchedule[workSchedule.length - 1].to : from,
        to: 3 * 24 * 60 - 1
    });

    return freeTimes;
}

/**
 * Переводит расписание в часовой пояс
 * @param {Array} schedule – Расписание одного объекта
 * @param {Number} timeZone - Часовой пояс
 * @returns {Array}
 */
function formatSchedule(schedule, timeZone) {
    return schedule.map(({ from, to }) => ({
        from: formatTime(from, timeZone),
        to: formatTime(to, timeZone)
    }));
}

/**
 * Возвращает время в минутах прошедшее с понедельника 00:00 требуемого часового пояса
 * @param {Object} time – Форматируемое время
 * @param {String} formattedTime.day – День, например, 'ПН'
* @param {Number} formattedTime.hours - Часы
 * @param {Number} formattedTime.minutes - Минуты
 * @param {Number} formattedTime.timezone - Часовой пояс форматируемого времени
 * @param {Number} timeZone - Требуемый часовой пояс
 * @returns {Number}
 */
function formatTime(time, timeZone) {
    const [day, hours, minutes, tz] = time.split(/\s|:|\+/);
    const difference = (timeZone - parseInt(tz)) * 60;
    let timeInMinutes = 0;

    if (day === 'ВТ') {
        timeInMinutes += 24 * 60;
    } else if (day === 'СР') {
        timeInMinutes += 48 * 60;
    }

    timeInMinutes += parseInt(hours) * 60 + parseInt(minutes) + difference;

    return timeInMinutes;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

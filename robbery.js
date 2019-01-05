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
        if (times[i].to >= times[i].from + duration) {
            return times[i].from;
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

    let jointSchedule = [];
    const DannyJointRusty = intersectSchedule(gangSchedules[0], gangSchedules[1]);
    const LinusJointBank = intersectSchedule(gangSchedules[2], formattedBankSchedule);
    if (DannyJointRusty.length && LinusJointBank.length) {
        jointSchedule = intersectSchedule(DannyJointRusty, LinusJointBank);
    }

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
    if (firstSchedule.from > secondSchedule.from) {
        if (firstSchedule.from > secondSchedule.to) {
            return null;
        }

        return firstSchedule.to > secondSchedule.to
            ? { from: firstSchedule.from, to: secondSchedule.to }
            : firstSchedule;
    }
    if (secondSchedule.from > firstSchedule.to) {
        return null;
    }

    return secondSchedule.to > firstSchedule.to
        ? { from: secondSchedule.from, to: firstSchedule.to }
        : secondSchedule;
}

/**
 * Возвращает свободное время члена банды
 * @param {Array} workSchedule - Рабочее время члена банды
 * @returns {Array}
 */
function freeTimeSchedule(workSchedule) {
    let from = 0;
    const freeTimes = [];

    workSchedule.forEach((time, i) => {
        freeTimes[i] = { from, to: time.from };
        from = time.to;
    });
    freeTimes[workSchedule.length] = { from: workSchedule.length
        ? workSchedule[workSchedule.length - 1].to : from, to: 3 * 24 * 60 - 1 };

    return freeTimes;
}

/**
 * Переводит расписание в часовой пояс банка
 * @param {Array} schedule – Расписание одного объекта
 * @param {Number} bankTimeZone - Часовой пояс банка
 * @returns {Array}
 */
function formatSchedule(schedule, bankTimeZone) {
    return schedule.map(element => {
        return { from: timeToTimezone(timeToMinutes(element.from), bankTimeZone),
            to: timeToTimezone(timeToMinutes(element.to), bankTimeZone) };
    });
}

/**
 * @param {Object} formattedTime – Форматируемое время
 * @param {String} formattedTime.day – День, например, 'ПН'
 * @param {Number} formattedTime.minutes - Время дня в минутах
 * @param {Number} formattedTime.timezone - Часовой пояс форматируемого времени
 * @param {Number} bankTimeZone - Часовой пояс банка
 * @returns {Number}
 */
function timeToTimezone(formattedTime, bankTimeZone) {
    const difference = (bankTimeZone - formattedTime.timezone) * 60;
    let minutes = 0;

    if (formattedTime.day === 'ВТ') {
        minutes += 24 * 60;
    } else if (formattedTime.day === 'СР') {
        minutes += 48 * 60;
    }

    minutes += formattedTime.minutes + difference;

    return minutes;
}

/**
 * @param {String} dayAndTime – Время, например, 'ПН 12:00+5'
 * @returns {Object}
 */
function timeToMinutes(dayAndTime) {
    return {
        day: dayAndTime.split(/\s|:|\+/)[0],
        minutes: parseInt(dayAndTime.split(/\s|:|\+/)[1]) * 60 +
            parseInt(dayAndTime.split(/\s|:|\+/)[2]),
        timezone: parseInt(dayAndTime.split(/\s|:|\+/)[3])
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

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

    let findedTime = findTime(schedule, workingHours, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return findedTime;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!findedTime) {
                return '';
            }
            let day = days[Math.floor(findedTime / (24 * 60))];
            let hours = Math.floor(findedTime % (24 * 60) / 60);
            let minutes = findedTime % 60;

            return template
                .replace('%HH', hours || '00')
                .replace('%MM', minutes || '00')
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

function findTime(schedule, workingHours, duration) {
    let times = findTotalJointSchedule(schedule, workingHours);
    for (let i = 0; i < times.length; i++) {
        if (times[i].to >= times[i].from + duration) {
            return times[i].from;
        }
    }

    return false;
}

function findTotalJointSchedule(schedule, workingHours) {
    let bankTimezone = parseInt(workingHours.from.slice(6));
    let bankSchedule = formatSchedule([
        { from: 'ПН ' + workingHours.from, to: 'ПН ' + workingHours.to },
        { from: 'ВТ ' + workingHours.from, to: 'ВТ ' + workingHours.to },
        { from: 'СР ' + workingHours.from, to: 'СР ' + workingHours.to }
    ], bankTimezone);
    let DannyTime = freeTimeSchedule(formatSchedule(schedule.Danny, bankTimezone));
    let RustyTime = freeTimeSchedule(formatSchedule(schedule.Rusty, bankTimezone));
    let LinusTime = freeTimeSchedule(formatSchedule(schedule.Linus, bankTimezone));

    let jointSchedule = findJointSchedule([DannyTime, RustyTime, LinusTime, bankSchedule]);

    return jointSchedule;
}

function findJointSchedule(formattedSchedule) {
    let jointSchedule = [];
    let firstJointSecond = intersectSchedule(formattedSchedule[0], formattedSchedule[1]);
    let thirdJointBank = intersectSchedule(formattedSchedule[2], formattedSchedule[3]);
    if (firstJointSecond.length !== 0 && thirdJointBank.length !== 0) {
        jointSchedule = intersectSchedule(firstJointSecond, thirdJointBank);
    }

    return jointSchedule;
}

function intersectSchedule(firstSchedule, secondSchedule) {
    let jointSchedule = [];
    firstSchedule.forEach(firstElem => {
        secondSchedule.forEach(secondElem => {
            let currentSchedule = intersectTimes(firstElem, secondElem);
            if (currentSchedule) {
                jointSchedule.push(currentSchedule);
            }
        });
    });

    return jointSchedule;
}

// return пересечение временных отрезков или false
function intersectTimes(firstSchedule, secondSchedule) {
    if (firstSchedule.from > secondSchedule.from) {
        if (firstSchedule.from > secondSchedule.to) {
            return false;
        }

        return firstSchedule.to > secondSchedule.to
            ? { from: firstSchedule.from, to: secondSchedule.to }
            : firstSchedule;
    }
    if (secondSchedule.from > firstSchedule.to) {
        return false;
    }

    return secondSchedule.to > firstSchedule.to
        ? { from: secondSchedule.from, to: firstSchedule.to }
        : secondSchedule;
}

function freeTimeSchedule(workSchedule) {
    let from = 0;
    let freeTimes = [];
    workSchedule.forEach(time => {
        freeTimes.push({ from, to: time.from });
        from = time.to;
    });
    freeTimes.push({ from: workSchedule[workSchedule.length - 1].to, to: 3 * 24 * 60 });

    return freeTimes;
}

function formatSchedule(schedule, bankTimezone) {
    return schedule.map(element => {
        return { from: timeToTimezone(timeToMinutes(element.from), bankTimezone),
            to: timeToTimezone(timeToMinutes(element.to), bankTimezone) };
    });
}

function timeToTimezone(formattedTime, bankTimeZone) {
    const difference = (bankTimeZone - formattedTime.timezone) * 60;
    let minutes = 0;

    if (formattedTime.day === 'ВТ') {
        minutes += 24 * 60;
    } else if (formattedTime.day === 'СР') {
        minutes += 48 * 60;
    }

    minutes = minutes + formattedTime.minutes + difference;

    return minutes;
}

function timeToMinutes(dayAndTime) {
    return {
        day: dayAndTime.slice(0, 2),
        minutes: parseInt(dayAndTime.slice(3, 5)) * 60 + parseInt(dayAndTime.slice(6, 8)),
        timezone: parseInt(dayAndTime.slice(9))
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

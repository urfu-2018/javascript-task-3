'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const dayToHours = new Map(
    [['ПН', 0],
        ['ВТ', 24],
        ['СР', 48]]
);

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
    let bankTime = parseInt(workingHours.from.slice(6));
    schedule.bank = convertWorkingHoursToBusyIntervals(workingHours);
    let unitedListOfBusyIntervals = getUnitedListOfBusyIntervals(schedule, bankTime);
    let freeTime = getFreeTime(unitedListOfBusyIntervals);
    let goodTimes = freeTime.filter(x => x[1] - x[0] >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return goodTimes.length > 0;
        },

        find: function (border) {
            let start =
                (freeTime.find((x) => x[1] - Math.max(x[0], border) >= duration) || [undefined])[0];

            return Math.max(start, border);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (goodTimes.length === 0) {
                return '';
            }
            let startTime = goodTimes[0][0];
            const days = ['ПН', 'ВТ', 'СР'];
            const dayIndex = Math.floor(startTime / (24 * 60));
            const day = days[dayIndex];
            const hour = (Math.floor((startTime - 24 * 60 * dayIndex) / 60)).toString();
            let paddedHour = hour.length === 1 ? '0' + hour : hour;
            const minute = (startTime % 60).toString();
            let paddedMinute = minute.length === 1 ? '0' + minute : minute;

            const replacementDict = { '%HH': paddedHour, '%DD': day, '%MM': paddedMinute };

            return template.replace(/%HH|%MM|%DD/gi, m=>replacementDict[m]);

        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (goodTimes.length === 0) {
                return false;
            }
            if (goodTimes[0][1] - goodTimes[0][0] >= duration + 30) {
                goodTimes[0][0] += 30;

                return true;
            }
            if (goodTimes.length > 1) {
                goodTimes.shift();

                return true;
            }

            return false;
        }
    };
}

function convertToMinutesInBankTime(timestring, bankTime) {
    let day = timestring.slice(0, 2);
    let hours = parseInt(timestring.slice(3, 5)) - parseInt(timestring.slice(9)) + bankTime;
    let minutes = parseInt(timestring.slice(6, 8));

    return (dayToHours.get(day) + hours) * 60 + minutes;
}

function getUnitedListOfBusyIntervals(schedule, bankTime) {
    const intervals = [];
    for (let user in schedule) {
        if (! schedule.hasOwnProperty(user)) {
            continue;
        }
        let userSchedule = schedule[user];
        for (let i = 0; i < userSchedule.length; i++) {
            intervals.push(
                [convertToMinutesInBankTime(userSchedule[i].from, bankTime), user, 'from']);
            intervals.push(
                [convertToMinutesInBankTime(userSchedule[i].to, bankTime), user, 'to']);
        }
    }
    intervals.sort((a, b)=>a[0] - b[0]);

    return intervals;
}

function convertWorkingHoursToBusyIntervals(workingHours) {
    let bankTime = parseInt(workingHours.from.slice(6));
    let busyIntervals = [];
    let prefixes = ['ПН ', 'ВТ ', 'СР '];
    for (let i = 0; i < prefixes.length; i++) {
        let prefix = prefixes[i];
        busyIntervals.push({ from: `${prefix}00:00+${bankTime}`, to: prefix + workingHours.from });
        busyIntervals.push({ from: prefix + workingHours.to, to: `${prefix}23:59+${bankTime}` });
    }

    return busyIntervals;

}

function unionIntervalShouldBeOpened(isOpen, interval) {
    return Object.values(isOpen).every(x=>!x) && interval.length === 0;
}

function unionIntervalShouldBeClosed(isOpen, interval) {
    return !Object.values(isOpen).every(x=>!x) && interval.length === 1;
}

function getFreeTime(busyIntervals) {
    const isOpen = new Map();
    const resultIntervals = [];
    let interval = [0];
    for (let i = 0; i < busyIntervals.length; i++) {
        let time = busyIntervals[i];
        isOpen[time[1]] = time[2] === 'from';
        if (unionIntervalShouldBeOpened(isOpen, interval)) {
            interval.push(time[0]);
        } else if (unionIntervalShouldBeClosed(isOpen, interval)) {
            interval.push(time[0]);
            resultIntervals.push(interval);
            interval = [];
        }
    }

    return resultIntervals;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

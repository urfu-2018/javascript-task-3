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
    console.info(bankTime);
    schedule.bank = convertWorkingHoursToBusyIntervals(workingHours);
    console.info(schedule.bank);
    let unitedListOfBusyIntervals = getUnitedListOfBusyIntervals(schedule, bankTime);
    console.info(unitedListOfBusyIntervals);
    let freeTime = getFreeTime(unitedListOfBusyIntervals);
    console.info(freeTime);
    let firstInterval = freeTime.find((x) => x[1] - x[0] >= duration);
    let minTime = firstInterval ? firstInterval[0] : 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        find: function (border) {
            let start = (freeTime.find((x) => x[1] - Math.max(x[0], border) >= duration) || [undefined])[0];

            return Math.max(start, border);
        },

        exists: function (border) {
            if (!border) {
                border = minTime;
            }

            return freeTime.some((x) => x[1] - Math.max(x[0], border) >= duration);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let goodTime = freeTime.find((x) => x[1] - Math.max(x[0], minTime) >= duration);
            if (goodTime === undefined) {
                return '';
            }
            goodTime[0] = Math.max(goodTime[0], minTime);
            // minTime = goodTime[0];
            const days = ['ПН', 'ВТ', 'СР'];
            const startTime = goodTime[0];
            const dayIndex = Math.floor(startTime / (24 * 60));
            const day = days[dayIndex];
            const hour = Math.floor((startTime - 24 * 60 * dayIndex) / 60);
            let paddedHour = hour.toString().length === 1 ? '0' + hour.toString() : hour.toString();
            const minute = startTime % 60;
            let paddedMinute = minute.toString().length === 1 ? '0' + minute.toString() : minute.toString();

            const replacementDict = { '%HH': paddedHour, '%DD': day, '%MM': paddedMinute };

            return template.replace(/%HH|%MM|%DD/gi, m=>replacementDict[m]);

        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let later = this.find(minTime + 30);
            if (later) {
                minTime = later;

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
            intervals.push([convertToMinutesInBankTime(userSchedule[i].from, bankTime), user, 'from']);
            intervals.push([convertToMinutesInBankTime(userSchedule[i].to, bankTime), user, 'to']);
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
function getFreeTime(busyIntervals) {
    const isOpen = new Map();
    const resultIntervals = [];
    let interval = [];
    for (let i = 0; i < busyIntervals.length; i++) {
        let time = busyIntervals[i];
        isOpen[time[1]] = time[2] === 'from';
        if (Object.values(isOpen).every(x=>!x) && interval.length === 0) {
            interval.push(time[0]);
        } else if (!Object.values(isOpen).every(x=>!x) && interval.length === 1) {
            interval.push(time[0]);
            resultIntervals.push(interval);
            interval = [];
        }
    }

    if (interval.length === 1) {
        interval.push(4319);
        resultIntervals.push(interval);
    }

    return resultIntervals;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

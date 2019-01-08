'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

const days = ['ПН', 'ВТ', 'СР'];
const reg = /(\d{2}):(\d{2})\+(\d+)/;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const timeZoneBank = parseInt(workingHours.from.split('+').slice(-1)[0]) * 60;
    let sortedTimeList = getSuccessfulTimes();
    let finalFreeTime = mergerWithBank(combineTime(sortedTimeList));

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return finalFreeTime.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (finalFreeTime.length === 0) {
                return '';
            }
            const [minutes, hours, day] = converterTime(finalFreeTime[0][0]);

            return template
                .replace('%MM', minutes)
                .replace('%HH', hours)
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

    function getSuccessfulTimes() {
        let datePointes = [];
        Object.keys(schedule).forEach(robber => {
            schedule[robber].forEach(date => {
                let minutesFrom = parseTime(date.from) + timeZoneBank;
                let minutesTo = parseTime(date.to) + timeZoneBank;
                datePointes.push([minutesFrom, minutesTo]);
            });
        });

        return datePointes.sort((a, b) => a[0] - b[0]);
    }

    function parseTime(time, day) {
        const regTime = time.match(reg);
        const hours = Number(regTime[1]);
        const minutes = Number(regTime[2]);
        const timeZone = Number(regTime[3]);
        if (day === undefined) {
            day = time.slice(0, 2);
        }

        return Number((days.indexOf(day) * 24 + hours - timeZone) * 60 + minutes);
    }

    function combineTime(timeList) {
        const combineTimeList = [timeList[0]];

        for (const interval of timeList.slice(1)) {
            if (combineTimeList[combineTimeList.length - 1][1] < interval[0]) {
                combineTimeList.push(interval);
            } else if (combineTimeList[combineTimeList.length - 1][1] < interval[1]) {
                combineTimeList[combineTimeList.length - 1][1] = interval[1];
            }
        }

        return combineTimeList;
    }

    function mergerWithBank(combineTimeList) {
        let workingHoursBank = parserWorkingHours(workingHours.from, workingHours.to);
        let freeTime = reverseTime(combineTimeList);
        let result = [];
        for (let firstTime of workingHoursBank) {
            for (let secondTime of freeTime) {
                result = calculate(firstTime, secondTime, result);
            }
        }

        return result;
    }

    function calculate(firstTime, secondTime, result) {
        let value = [Math.max(firstTime[0], secondTime[0]),
            Math.min(firstTime[1], secondTime[1])];
        if ((value[0] < value[1]) && (value[1] - value[0] >= duration)) {
            result.push(value);
        }

        return result;
    }

    function parserWorkingHours(startTime, finalTime) {
        let workingHoursBank = days.map(
            value => [parseTime(startTime, value) + timeZoneBank,
                parseTime(finalTime, value) + timeZoneBank]);

        return workingHoursBank;
    }

    function reverseTime(combineTimeList) {
        let result = [];
        let firstValue = 0;
        let finalTime = 4320;
        for (let value of combineTimeList) {
            result.push([firstValue, value[0]]);
            firstValue = value[1];
        }
        let finalValue = combineTimeList[combineTimeList.length - 1];
        result.push([finalValue[1], finalTime]);

        return result;
    }

    function converterTime(freeTime) {
        const minutes = format(freeTime % 60);
        const hours = format((Math.floor(freeTime / 60)) % 24);
        const day = days[Math.floor(Math.floor(freeTime / 60) / 24)];

        return [minutes, hours, day];
    }

    function format(times) {
        if (times <= 9) {
            return '0' + times;
        }

        return times;
    }


}

module.exports = {
    getAppropriateMoment,

    isStar
};

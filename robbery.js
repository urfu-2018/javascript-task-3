'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const hoursInDay = 24;
const minutesInHour = 60;
const weekDays = {
    'ПН': 1,
    'ВТ': 2,
    'СР': 3,
    'ЧТ': 4,
    'ПТ': 5,
    'СБ': 6,
    'ВС': 7
};

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

    const bankSchedule = [
        { from: 'ПН ' + workingHours.from, to: 'ПН ' + workingHours.to },
        { from: 'ВТ ' + workingHours.from, to: 'ВТ ' + workingHours.to },
        { from: 'СР ' + workingHours.from, to: 'СР ' + workingHours.to }
    ];
    const bankOffset = parseInt(workingHours.from.slice(6));
    const bankIntervals = mapScheduleToMinutesIntervalsWithNewOffset(
        bankSchedule, bankOffset
    );
    let allFreeTime = bankIntervals;
    Object.keys(schedule).forEach(robber => {
        const minutesIntervals = mapScheduleToMinutesIntervalsWithNewOffset(
            schedule[robber], bankOffset
        );
        const freeTime = getFreeTime(minutesIntervals);
        allFreeTime = intersect(allFreeTime, freeTime);
    });
    const result = allFreeTime.filter(entry => entry.minutesTo - entry.minutesFrom >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return result.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (result.length === 0) {
                return '';
            }
            const startTime = result[0].minutesFrom;
            const dayIndex = Math.floor(startTime / (hoursInDay * minutesInHour));
            const day = ['ПН', 'ВТ', 'СР'][dayIndex - 1];
            let hour = (Math.floor(
                (startTime - hoursInDay * minutesInHour * dayIndex) / minutesInHour)
            ).toString();
            if (hour.length === 1) {
                hour = '0' + hour;
            }
            let minute = (startTime % 60).toString();
            if (minute.length === 1) {
                minute = '0' + minute;
            }
            const replacements = { '%HH': hour, '%DD': day, '%MM': minute };
            const replacer = fragment => replacements[fragment];

            return template.replace(/%HH|%MM|%DD/gi, replacer);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (result.length === 0) {
                return false;
            }
            const interval = result[0];
            const factDuration = interval.minutesTo - interval.minutesFrom;
            const needDuration = duration;
            if (factDuration - 30 >= needDuration) {
                interval.minutesFrom += 30;

                return true;
            }

            if (result.length > 1) {
                result.shift();

                return true;
            }

            return false;
        }
    };
}

function mapDateToMinutesWithNewOffset(date, newOffset) {
    const [day, time] = date.split(' ');
    const [hAndM, oldOffset] = time.split('+');
    const [hours, minutes] = hAndM.split(':');
    const newHours = parseInt(hours) - parseInt(oldOffset) + newOffset;

    return (weekDays[day] * hoursInDay + newHours) * minutesInHour + parseInt(minutes);
}

function mapScheduleToMinutesIntervalsWithNewOffset(schedule, newOffset) {
    return schedule.map(entry => {
        return {
            minutesFrom: mapDateToMinutesWithNewOffset(entry.from, newOffset),
            minutesTo: mapDateToMinutesWithNewOffset(entry.to, newOffset)
        };
    });
}

function getFreeTime(intervals) {
    intervals.sort((a, b) => a.minutesFrom > b.minutesFrom);
    const result = [];
    let limit = 0;
    intervals.forEach(entry => {
        result.push({
            minutesFrom: limit,
            minutesTo: entry.minutesFrom
        });
        limit = entry.minutesTo;
    });
    result.push({
        minutesFrom: limit,
        minutesTo: hoursInDay * 7 * minutesInHour - 1
    });

    return result;
}

function intersect(intervals1, intervals2) {
    const comparator = (a, b) => a.minutesFrom > b.minutesFrom;
    intervals1.sort(comparator);
    intervals2.sort(comparator);
    const result = [];
    intervals1.forEach(entry1 => {
        intervals2.forEach(entry2 => {
            if (entry1.minutesFrom < entry2.minutesTo &&
                entry1.minutesTo > entry2.minutesFrom) {
                result.push({
                    minutesFrom: Math.max(entry1.minutesFrom, entry2.minutesFrom),
                    minutesTo: Math.min(entry1.minutesTo, entry2.minutesTo)
                });
            }
        });
    });

    return result;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

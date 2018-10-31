'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
const days = ['ПН', 'ВТ', 'СР'];

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const bankTimeZone = parseInt(workingHours.from.substring(6));
    let bankSchedule = getNewScheduleBank(workingHours, bankTimeZone);
    let newSchedule = getNewScheduleFormat(schedule, bankTimeZone);
    let mergedSchedule = bankSchedule;
    Object.keys(newSchedule).forEach(key => {
        mergedSchedule = merge(newSchedule[key], mergedSchedule);
    });
    const rightTimes = (mergedSchedule
        .filter(t => t.to - t.from >= duration))
        .map(t => parseMinutesToDate(t.from));

    return {
        moments: rightTimes,

        exists: function () {
            return this.moments.length > 0;
        },

        format: function (template) {
            if (!this.exists()) {
                return '';
            }
            const moment = this.moments[0];
            template = template.replace(/%DD/, moment.day);
            template = template.replace(/%HH/, moment.hours);
            template = template.replace(/%MM/, moment.minutes);

            return template;
        },

        tryLater: function () {
            return false;
        }
    };
}

function dayToMinutes(day) {
    if (day === 'ПН') {
        return 0;
    } else if (day === 'ВТ') {
        return 24 * 60;
    } else if (day === 'СР') {
        return 24 * 2 * 60;
    }

    return 10000;
}

function getNewScheduleBank(workingHours, bankTimeZone) {
    const newWorkSchedule = [];
    days.forEach(day => {
        const daySchedule = {
            from: dayToMinutes(day) + parseTimeToMinutes(workingHours.from, bankTimeZone),
            to: dayToMinutes(day) + parseTimeToMinutes(workingHours.to, bankTimeZone)
        };
        newWorkSchedule.push(daySchedule);
    });

    return newWorkSchedule;
}

function parseMinutesToDate(minutes) {
    const day = days[Math.floor(minutes / (24 * 60))];
    minutes -= Math.floor(minutes / (24 * 60)) * (24 * 60);
    const hour = numberToTwoDigitableString(Math.floor(minutes / 60));
    minutes -= Math.floor(minutes / 60) * 60;
    const newMinutes = numberToTwoDigitableString(minutes);

    return { 'day': day, 'hours': hour, 'minutes': newMinutes };

}


function numberToTwoDigitableString(number) {
    if (number < 10) {
        return '0' + number;
    }

    return number.toString();
}

function merge(scheduleFirstBoy, scheduleSecondBoy) {
    const mergedSchedule = [];
    scheduleFirstBoy.forEach(timeZonaFirst => {
        scheduleSecondBoy.forEach((timeZonaSecond) => {
            let union = getUnion(timeZonaFirst, timeZonaSecond);
            if (union) {
                mergedSchedule.push(union);
            }
        });
    });

    return mergedSchedule;
}

function firstConditionIsTheUnion(timeRange1, timeRange2) {
    return timeRange1.from <= timeRange2.from && timeRange2.from <= timeRange1.to;
}

function secondConditionIsTheUnion(timeRange1, timeRange2) {
    return timeRange2.from <= timeRange1.from && timeRange1.from <= timeRange2.to;
}

function getUnion(timeRange1, timeRange2) {
    let union = {};
    if (firstConditionIsTheUnion(timeRange1, timeRange2)) {
        if (timeRange2.to >= timeRange1.to) {
            union = { 'from': timeRange2.from, 'to': timeRange1.to };
        } else {
            union = { 'from': timeRange2.from, 'to': timeRange2.to };
        }
    } else if (secondConditionIsTheUnion(timeRange1, timeRange2)) {
        if (timeRange1.to >= timeRange2.to) {
            union = { 'from': timeRange1.from, 'to': timeRange2.to };
        } else {
            union = { 'from': timeRange1.from, 'to': timeRange1.to };
        }
    } else {
        return false;
    }

    return union;
}

function getNewScheduleFormat(schedule, bankTimeZone) {
    const newSchedule = {};
    Object.keys(schedule).forEach(key => {
        newSchedule[key] = schedule[key].map(r => getNewScheduleRowFormat(r, bankTimeZone));
    });

    return revertSchedule(newSchedule);
}

function revertSchedule(schedule) {
    const freeTimeSchedule = [];
    Object.keys(schedule).forEach(key => {
        freeTimeSchedule[key] = getRevertSchedule(schedule[key]);
    });

    return freeTimeSchedule;
}

function getRevertSchedule(schedule) {
    const freeTimeSchedule = [];
    let left = 0;
    schedule.forEach(timeRange => {
        freeTimeSchedule.push({ from: left, to: timeRange.from });
        left = timeRange.to;
    });
    freeTimeSchedule.push({ 'from': left, 'to': days.length * 60 * 24 });

    return freeTimeSchedule;
}

function getNewScheduleRowFormat(r, bankTimeZone) {
    const newFrom = dayToMinutes(r.from.substring(0, 2)) +
        parseTimeToMinutes(r.from.substring(3), bankTimeZone);
    const newTo = dayToMinutes(r.to.substring(0, 2)) +
        parseTimeToMinutes(r.to.substring(3), bankTimeZone);

    return { from: newFrom, to: newTo };
}

function parseTimeToMinutes(time, bankTimeZone) {
    return parseInt(time.substring(0, 2)) * 60 +
        parseInt(time.substring(3, 5)) +
        (bankTimeZone - parseInt(time.substring(6))) * 60;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

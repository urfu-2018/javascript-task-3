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
    // console.info(schedule, duration, workingHours);
    let bankSchedule = getNewScheduleBank(workingHours, bankTimeZone);
    let newSchedule = getNewScheduleFormat(schedule, bankTimeZone);
    // const emptyDays = possibleWeHaveEmptyDay(schedule, newSchedule, bankSchedule);
    let mergedSchedule = bankSchedule;
    Object.keys(newSchedule).forEach(key => {
        mergedSchedule = merge(newSchedule[key], mergedSchedule);
    });
    // let possibleTimes = findDifference(mergedSchedule, bankSchedule);
    // if (emptyDays.length > 0) {
    //  possibleTimes.push(...emptyDays);
    // }
    const rightTimes = (mergedSchedule
        .filter(t => t.to - t.from >= duration))
        .map(t => minutesToDateObject(t.from));

    return {
        moments: rightTimes,
        index: 0,

        exists: function () {
            return this.moments.length > 0;
        },

        format: function (template) {
            if (!this.exists()) {
                return '';
            }
            const moment = this.moments[this.index];
            template = template.replace(/%DD/, moment.day);
            template = template.replace(/%HH/, moment.hours);
            template = template.replace(/%MM/, moment.minutes);

            return template;
        },

        tryLater: function () {
            if (this.moments[this.index + 1] === undefined) {
                return false;
            }
            this.index += 1;

            return true;
        }
    };
}

/* function possibleWeHaveEmptyDay(schedule, newSchedule, bankSchedule) {
    const emptyDays = [];
    const countDayInSschedule = { 'ПН': 0, 'ВТ': 0, 'СР': 0 };
    Object.keys(schedule).forEach(key => {
        schedule[key].forEach(r => {
            if ((r.from + r.to).indexOf('ПН') !== -1) {
                countDayInSschedule['ПН']++;
            }
            if ((r.from + r.to).indexOf('ВТ') !== -1) {
                countDayInSschedule['ВТ']++;
            }
            if ((r.from + r.to).indexOf('СР') !== -1) {
                countDayInSschedule['СР']++;
            }
        });
    });
    Object.keys(countDayInSschedule).forEach(k => {
        // if (countDayInSschedule[k] === 0) {
        emptyDays.push({
            from: dayToMinutes(k) + bankSchedule[0].from,
            to: (bankSchedule[0].to + dayToMinutes(k) + 24 * 60)
        });
        //  }
    });
    // const svobVremay = findDifference(emptyDays, newSchedule)

    return emptyDays;
} */

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

function minutesToDateObject(minutes) {
    const minutesInDay = 24 * 60;
    const daysCount = Math.floor(minutes / minutesInDay);
    const d = days[daysCount];
    minutes -= daysCount * minutesInDay;
    const hoursCount = Math.floor(minutes / 60);
    const h = numberToTwoDigitableString(hoursCount);
    minutes -= hoursCount * 60;
    const m = numberToTwoDigitableString(minutes);

    return { 'day': d, 'hours': h, 'minutes': m };

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
        scheduleSecondBoy.forEach((timeZonaSecond, i) => {
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

function revertSchedule(schedule){
    const freeTimeSchedule = [];
    Object.keys(schedule).forEach(key => {
        freeTimeSchedule[key] = getFreeTimeSchedule(schedule[key]);
    });
    return freeTimeSchedule;
}

function getFreeTimeSchedule(schedule) {
    const freeTimeSchedule = [];
    let leftBorder = -1;
    schedule.forEach(function (timeRange) {
        if (leftBorder < timeRange.from) {
            const freeTimeRange = { from: leftBorder, to: timeRange.from };
            freeTimeSchedule.push(freeTimeRange);
        }
        leftBorder = timeRange.to;
    });
    const end = days.length * 60 * 24;
    if (leftBorder < end) {
        const freeTimeRange = { 'from': leftBorder, 'to': end };
        freeTimeSchedule.push(freeTimeRange);
    }

    return freeTimeSchedule;
}

function getNewScheduleRowFormat(r, bankTimeZone) {
    const newFrom = dayToMinutes(r.from.substring(0, 2)) +
        parseTimeToMinutes(r.from.substring(3), bankTimeZone);
    const newTo = dayToMinutes(r.to.substring(0, 2)) +
        parseTimeToMinutes(r.to.substring(3), bankTimeZone);

    return { from: newFrom, to: newTo };
}

function findDifference(scheduleBoys, scheduleBank) {
    const possibleTimes = [];
    scheduleBank.forEach(bankTime => {
        let flagNichego = true;
        scheduleBoys.forEach(boysTime => {
            if (boysTime.from >= bankTime.from && boysTime.from <= bankTime.to) {
                flagNichego = false;
                let from = bankTime.from;
                scheduleBoys.forEach(s => {
                    if (s.to < boysTime.from && s.to > bankTime.from) {
                        from = s.to;
                    }
                });
                possibleTimes.push({ 'from': from, 'to': boysTime.from });
            }
            if (boysTime.to <= bankTime.to && boysTime.to >= bankTime.from) {
                flagNichego = false;
                let to = bankTime.to;
                scheduleBoys.forEach(s => {
                    if (s.from > boysTime.to && s.to < bankTime.to) {
                        to = s.from;
                    }
                });
                possibleTimes.push({ 'from': boysTime.to, 'to': to });
            }
        });
        if (flagNichego) {
            possibleTimes.push(bankTime);
        }
    });
    if (scheduleBoys.length === 0) {
        return scheduleBank;
    }

    return possibleTimes;
}

/*
const days = ['ПН', 'ВТ', 'СР'];
function mmayb1eDays(scheduleBoy) {
    days.forEach(e => {
        if (!maybeDay(scheduleBoy, e)) {
            days.splice(days.indexOf(e), 1)
        }
    });
}

function maybeDay(schedule, day) {
    let haveTimeIsCurrentDay = false;
    schedule.forEach(element => {
        if (element.from.indexOf(day) !== -1) {
            haveTimeIsCurrentDay = true;
        }
    });
    return haveTimeIsCurrentDay;
}
*/
function parseTimeToMinutes(time, bankTimeZone) {
    return parseInt(time.substring(0, 2)) * 60 +
        parseInt(time.substring(3, 5)) +
        (bankTimeZone - parseInt(time.substring(6))) * 60;
}

module.exports = {
    getAppropriateMoment,

    isStar
};

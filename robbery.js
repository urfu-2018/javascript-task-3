'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const days = ['ПН', 'ВТ', 'СР', 'ЧТ'];

function dataSort(date1, date2) {
    return date1.from.day * 1440 + date1.from.hours * 60 + date1.from.minutes >=
        date2.from.day * 1440 + date2.from.hours * 60 + date2.from.minutes;
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
    var availableTimes = getMoments(schedule, duration, workingHours);
    // console.info(availableTimes);
    var laterVariants = (availableTimes.length > 0) ? getLater(availableTimes, duration) : [];
    const resultArray = availableTimes.concat(laterVariants).sort(dataSort);
    var currentResult = (availableTimes.length > 0) ? resultArray[0].from : {};
    var laterMomentsCounter = 0;
    // console.info(resultArray);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return availableTimes.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (availableTimes.length > 0) {
                var result = '';
                result = template.replace('%HH', currentResult.hours);
                const minutes = currentResult.minutes.toString();
                result = result.replace('%MM', (minutes.length !== 2) ? '0' + minutes : minutes);
                result = result.replace('%DD', days[currentResult.day]);

                return result;
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            laterMomentsCounter++;
            if (resultArray[laterMomentsCounter] !== undefined) {
                currentResult = resultArray[laterMomentsCounter].from;

                return true;
            }

            return false;
        }
    };
}

function getLater(variants, duration) {
    const newVariants = [];
    const day = variants[0].from.day;
    // var currentTime = variants[0].from;
    variants.forEach(function (i) {
        var currentTime = i.from;
        while (timeBigger(i.to, currentTime)) {
            const isHourNotChanging = currentTime.minutes + 30 === 30;
            currentTime = {
                minutes: (isHourNotChanging) ? currentTime.minutes + 30 : 0,
                hours: (isHourNotChanging) ? currentTime.hours : currentTime.hours + 1
            };
            const probablePeriod = {
                from: {
                    day: day,
                    hours: currentTime.hours,
                    minutes: currentTime.minutes
                },
                to: {
                    day: day,
                    hours: i.to.hours,
                    minutes: i.to.minutes
                }
            };
            if (checkProbablePeriod(probablePeriod, duration)) {
                newVariants.push(probablePeriod);
            } else {
                break;
            }
        }
    });

    return newVariants;
}

function getMoments(schedule, duration, workingHours) {
    const formattedSchedule = transformSchedule(schedule, workingHours);
    const [monSchedule, tueSchedule, wenSchedule] = separateSchedule(formattedSchedule);
    const monAvailableTime = findAvailableTime(workingHours, monSchedule, duration);
    const tueAvailableTime = findAvailableTime(workingHours, tueSchedule, duration);
    const wenAvailableTime = findAvailableTime(workingHours, wenSchedule, duration);

    return monAvailableTime.concat(tueAvailableTime, wenAvailableTime);
}

function assignInitialValue(bankSchedule, schedule) {
    var isbankTimeFromBigger = timeBigger(bankSchedule.from, schedule[0].from);
    var isBankTimeToBigger = timeBigger(bankSchedule.to, schedule[0].to);

    return {
        from: {
            day: schedule[0].from.day,
            hours: (isbankTimeFromBigger) ? bankSchedule.from.hours : schedule[0].from.hours,
            minutes: (isbankTimeFromBigger) ? bankSchedule.from.minutes : schedule[0].from.minutes
        },
        to: {
            day: schedule[0].from.day,
            hours: (isBankTimeToBigger) ? schedule[0].to.hours : bankSchedule.to.hours,
            minutes: (isBankTimeToBigger) ? schedule[0].to.minutes : bankSchedule.to.minutes
        }
    };
}

function findAvailableTime(workingHours, schedule, duration) {
    const bankSchedule = formatWorkingTimeRecord(workingHours);
    const day = schedule[0].from.day;
    var periods = [];
    var currentPeriod = assignInitialValue(bankSchedule, schedule);
    schedule.forEach(function (i) {
        const isBankTimeToBigger = timeBigger(bankSchedule.to, i.to);
        if (timeBigger(i.from, currentPeriod.to) && isBankTimeToBigger) { // если есть точка разрыва
            const probablePeriod = {
                from: {
                    day: day,
                    hours: currentPeriod.to.hours,
                    minutes: currentPeriod.to.minutes
                },
                to: {
                    day: day,
                    hours: i.from.hours,
                    minutes: i.from.minutes
                }
            };
            periods.push(probablePeriod);
            currentPeriod.from = (timeBigger(i.from, bankSchedule.to)) ? bankSchedule.to : i.from;
            currentPeriod.to = (timeBigger(i.to, bankSchedule.to)) ? bankSchedule.to : i.to;
        }

        currentPeriod.to = resolveEnd(isBankTimeToBigger, i, currentPeriod, bankSchedule);
    });

    if (timeBigger(currentPeriod.from, bankSchedule.from) && periods.length === 0) {
        const probablePeriod = {
            from: {
                day: day,
                hours: bankSchedule.from.hours,
                minutes: bankSchedule.from.minutes
            },
            to: {
                day: day,
                hours: currentPeriod.from.hours,
                minutes: currentPeriod.from.minutes
            }
        };
        periods.push(probablePeriod);
    }

    if (timeBigger(bankSchedule.to, currentPeriod.to)) {
        const probablePeriod = {
            from: {
                day: day,
                hours: currentPeriod.to.hours,
                minutes: currentPeriod.to.minutes
            },
            to: {
                day: day,
                hours: bankSchedule.to.hours,
                minutes: bankSchedule.to.minutes
            }
        };
        periods.push(probablePeriod);
    }

    const filteredPeriods = [];
    periods.forEach(function (i) {
        if (checkProbablePeriod(i, duration)) {
            filteredPeriods.push(i);
        }
    });

    return filteredPeriods;
}

// function formAndCheckPeriod(){
//     const probablePeriod = {
//         from: {
//             day: currentPeriod.to.day,
//             hours: currentPeriod.to.hours,
//             minutes: currentPeriod.to.minutes
//         },
//         to: {
//             day: currentPeriod.to.day,
//             hours: bankSchedule.to.hours,
//             minutes: bankSchedule.to.minutes
//         }
//     };
//     if (checkProbablePeriod(probablePeriod, duration)) {
//         periods.push(probablePeriod);
//     }
// }
function resolveEnd(isBankTimeToBigger, i, currentPeriod, bankSchedule) {
    if (isBankTimeToBigger) {
        if (timeBigger(i.to, currentPeriod.to)) {
            return i.to;
        }

        return currentPeriod.to;
    }

    return bankSchedule.to;
}


function checkProbablePeriod(probablePeriod, duration) {
    return (probablePeriod.to.hours * 60 + probablePeriod.to.minutes -
        (probablePeriod.from.hours * 60 + probablePeriod.from.minutes) - duration) >= 0;
}

function timeBigger(time1, time2) {
    return time1.hours * 60 + time1.minutes >= time2.minutes + time2.hours * 60;
}


function separateSchedule(schedule) {
    var monSchedule = [];
    var tueSchedule = [];
    var wenSchdule = [];

    schedule.forEach(function (i) {
        switch (i.from.day) {
            case 0:
                monSchedule.push(i);
                break;
            case 1:
                tueSchedule.push(i);
                break;
            case 2:
                wenSchdule.push(i);
                break;
            default:
                break;
        }
    });

    return [monSchedule.sort(timeSort), tueSchedule.sort(timeSort), wenSchdule.sort(timeSort)];
}

function timeSort(time1, time2) {
    const time1minutes = time1.from.hours * 60 + time1.from.minutes;
    const time2minutes = time2.from.hours * 60 + time2.from.minutes;

    return time1minutes >= time2minutes;
}

function transformSchedule(schedule, workingHours) {
    const formatedWorkingHours = formatWorkingTimeRecord(workingHours);
    const allSchedules = schedule.Danny.concat(schedule.Rusty, schedule.Linus);
    var cleanSchedules = [];
    allSchedules.forEach(function (i) {
        const newRecord = formatSchedule(formatedWorkingHours, i);
        const spittedDays = splitDays(newRecord);
        if (spittedDays.length > 0) {
            spittedDays.forEach(function (t) {
                cleanSchedules.push(t);
            });
        } else {
            cleanSchedules.push(newRecord);
        }
    });

    return cleanSchedules;
}

function splitDays(record) {
    const daysDelta = record.to.day - record.from.day;
    var newRecords = [];
    var startDate = record.from;
    if (daysDelta) {
        for (var i = 0; i < daysDelta; i++) {
            newRecords.push({
                from: {
                    day: startDate.day,
                    hours: startDate.hours,
                    minutes: startDate.minutes
                },
                to: {
                    day: startDate.day,
                    hours: 23,
                    minutes: 59
                }
            });

            startDate = {
                day: startDate.day + i + 1,
                hours: 0,
                minutes: 0
            };
        }
        newRecords.push({
            from: {
                day: startDate.day,
                hours: startDate.hours,
                minutes: startDate.minutes
            },
            to: {
                day: record.to.day,
                hours: record.to.hours,
                minutes: record.to.minutes
            }
        });
    }

    return newRecords;
}

function formatWorkingTimeRecord(workingHours) {
    const fromTimeSplittedPlus = workingHours.from.split('+');
    const fromTimeHoursSplitted = fromTimeSplittedPlus[0].split(':');
    const toTimeSplittedPlus = workingHours.to.split('+');
    const toTimeHoursSplitted = toTimeSplittedPlus[0].split(':');
    const bankTimezone = parseInt(fromTimeSplittedPlus[1]);

    return {
        timezone: bankTimezone,
        from: {
            hours: parseInt(fromTimeHoursSplitted[0]),
            minutes: parseInt(fromTimeHoursSplitted[1])
        },
        to: {
            hours: parseInt(toTimeHoursSplitted[0]),
            minutes: parseInt(toTimeHoursSplitted[1])
        }
    };
}


function formatSchedule(workingHours, record) {
    const fromTimeSplittedPlus = record.from.split('+');
    const recordTimezone = parseInt(fromTimeSplittedPlus[1]);
    const timezonesDelta = workingHours.timezone - recordTimezone;
    const fromTimeHoursSplitted = fromTimeSplittedPlus[0].split(':');
    var fromTime = {
        day: days.indexOf(fromTimeHoursSplitted[0].split(' ')[0]),
        hours: parseInt(fromTimeHoursSplitted[0].split(' ')[1]),
        minutes: parseInt(fromTimeHoursSplitted[1])
    };
    fromTime = correctTime(fromTime, workingHours, timezonesDelta);


    const toTimeSplittedPlus = record.to.split('+');
    const toTimeHoursSplitted = toTimeSplittedPlus[0].split(':');
    var toTime = {
        day: days.indexOf(toTimeHoursSplitted[0].split(' ')[0]),
        hours: parseInt(toTimeHoursSplitted[0].split(' ')[1]),
        minutes: parseInt(toTimeHoursSplitted[1])

    };
    toTime = correctTime(toTime, workingHours, timezonesDelta);


    return { from: fromTime, to: toTime };
}

function correctTime(robberTime, bankTime, deltaTimezones) {
    var correctedHours = robberTime.hours + deltaTimezones;
    var correctedDay = (Math.floor(correctedHours / 24) > 0) ? robberTime.day + 1 : robberTime.day;

    return {
        day: correctedDay,
        hours: correctedHours,
        minutes: robberTime.minutes
    };
}

module.exports = {
    getAppropriateMoment,
    isStar
};

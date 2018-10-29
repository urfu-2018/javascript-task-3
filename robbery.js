'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
const DAYS_WEEK = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

function getAppropriateMoment(schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            const timeJobByDuration = getTimeForJob(schedule, duration, workingHours);

            if (timeJobByDuration.length) {
                return true;
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            const timeJobByDuration = getTimeForJob(schedule, duration, workingHours);
            if (!timeJobByDuration.length) {
                return '';
            }

            const timeStart = new Date(timeJobByDuration[0][0][0]);
            let startIn = template.replace(/%HH/, getStrTime(timeStart.getHours()));
            startIn = startIn.replace(/%MM/, getStrTime(timeStart.getMinutes()));
            startIn = startIn.replace(/%DD/, DAYS_WEEK[timeStart.getDay()]);

            return startIn;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const timeJobByDuration = getTimeForJob(schedule, duration, workingHours);
            if (!timeJobByDuration.length) {
                return false;
            }
            const lastTime = new Date(timeJobByDuration[0][0][0] - 1 * 60 * 1000);
            const nextTime = new Date(timeJobByDuration[0][0][0] + 30 * 60 * 1000);
            schedule.Danny
                .push(getNewInterval(lastTime, nextTime, workingHours));
            const newTimeForJob = getTimeForJob(schedule, duration, workingHours);
            if (newTimeForJob.length) {
                return true;
            }
            delete schedule.Danny[schedule.Danny.length - 1];

            return false;
        }
    };
}

function getNewInterval(lastTime, nextTime, workingHours) {
    const timeZoneBank = Number(workingHours.from.match(/\+(\d+)/)[1]);

    return {
        from: DAYS_WEEK[lastTime.getDay()] + ' ' +
        getStrTime(lastTime.getHours()) + ':' +
        getStrTime(lastTime.getMinutes()) + '+' +
        timeZoneBank,
        to: DAYS_WEEK[nextTime.getDay()] + ' ' +
        getStrTime(nextTime.getHours()) + ':' +
        getStrTime(nextTime.getMinutes()) + '+' +
        timeZoneBank
    };
}

function getStrTime(time) {
    const strTime = time.toString();

    return strTime.length === 1 ? '0' + strTime : strTime;
}

function getTimeForJob(schedule, duration, workingHours) {
    const busyTime = findTime(schedule, workingHours);
    const timeBank = formatTimeForBank(workingHours);
    const arrTimeForJob = [];
    for (const dayWeek in busyTime) {
        if (busyTime.hasOwnProperty(dayWeek)) {
            busyTime[dayWeek].sort(compareStartTime);
            arrTimeForJob.push(getTimeForWork(busyTime[dayWeek], timeBank));
        }
    }
    const timeJobByDuration = filterTimeDuration(arrTimeForJob, duration)
        .filter(time => time.length > 0);

    return timeJobByDuration;
}

function findTime(schedule, workingHours) {
    const timeBusy = {
        'ПН': [],
        'ВТ': [],
        'СР': []
    };
    for (const person in schedule) {
        if (schedule.hasOwnProperty(person)) {
            findTimeForPerson(schedule[person], person, timeBusy, workingHours);
        }
    }

    return timeBusy;
}

function findTimeForPerson(sheduleOfPerson, person, timeBusy, workingHours) {
    const timeZoneBank = Number(workingHours.from.match(/\+(\d+)/)[1]);
    for (const time of sheduleOfPerson) {
        if (time) {
            const parseTimeFrom = getFormatTime(time.from, timeZoneBank);
            const parseTimeTo = getFormatTime(time.to, timeZoneBank);
            setSheduleForWeekday(timeBusy, person, parseTimeFrom, parseTimeTo);
        }
    }
}

function setSheduleForWeekday(timeBusy, person, parseTimeFrom, parseTimeTo) {
    if (parseTimeFrom.dayWeek === parseTimeTo.dayWeek) {
        getPersonTime(timeBusy[parseTimeFrom.dayWeek], parseTimeFrom.time, parseTimeTo.time);
    } else {
        const dateFrom = new Date(parseTimeFrom.time);
        const dateTo = new Date(parseTimeTo.time);
        dateFrom.setHours(24, 0, 0);
        dateTo.setHours(0, 0, 0);
        getPersonTime(timeBusy[parseTimeFrom.dayWeek], parseTimeFrom.time, dateFrom);
        getPersonTime(timeBusy[parseTimeTo.dayWeek], dateTo, parseTimeTo.time);
    }
}

function getFormatTime(timeInString, timeZoneBank) {
    const parseTime = timeInString.match(/([А-Я]{2}) (\d{2}):(\d{2})\+(\d+)/i);
    const timeZonePerson = Number(parseTime[4]);
    const date = new Date(2018, 9, 1, Number(parseTime[2]), Number(parseTime[3]), 0, 0);
    date.setDate(date.getDate() + DAYS_WEEK.indexOf(parseTime[1]) - 1);
    if (timeZoneBank > timeZonePerson) {
        date.setHours(date.getHours() + timeZoneBank - timeZonePerson);
    } else if (timeZoneBank < timeZonePerson) {
        date.setHours(date.getHours() - timeZoneBank + timeZonePerson);
    }

    return {
        dayWeek: DAYS_WEEK[date.getDay()],
        time: date
    };
}

function getPersonTime(timeBusyDay, parseTimeFrom, parseTimeTo) {
    if (!timeBusyDay.length) {
        timeBusyDay.push([parseTimeFrom, parseTimeTo]);
    }
    for (const hoursBusy of timeBusyDay) {
        if (isIncludeInterval(hoursBusy, [parseTimeFrom, parseTimeTo])) {
            setInterval(hoursBusy, [parseTimeFrom, parseTimeTo]);
        } else {
            timeBusyDay.push([parseTimeFrom, parseTimeTo]);
        }
    }
}

function setInterval(hoursBusy, timePerson) {
    hoursBusy[0] = timePerson[0] < hoursBusy[0] ? timePerson[0] : hoursBusy[0];
    hoursBusy[1] = timePerson[1] > hoursBusy[1] ? timePerson[1] : hoursBusy[1];
}

function isIncludeInterval(hoursBusy, timePerson) {
    return timePerson[0] >= hoursBusy[0] && timePerson[0] <= hoursBusy[1] ||
            timePerson[1] >= hoursBusy[0] && timePerson[1] <= hoursBusy[1] ||
            timePerson[0] <= hoursBusy[0] && timePerson[1] >= hoursBusy[1];
}

function formatTimeForBank(workingHours) {
    const regHourAndMin = /(\d{2}):(\d{2})/;
    const formatFrom = workingHours.from.match(regHourAndMin);
    const formatTo = workingHours.to.match(regHourAndMin);
    const dateFrom = new Date(2018, 9, 1);
    dateFrom.setHours(formatFrom[1], formatFrom[2]);
    const dateTo = new Date(2018, 9, 1);
    dateTo.setHours(formatTo[1], formatTo[2]);

    return [dateFrom, dateTo];
}

function getTimeForWork(arrBusyTime, timeBank) {
    timeBank[0].setDate(arrBusyTime[0][0].getDate());
    timeBank[1].setDate(arrBusyTime[0][0].getDate());
    const dateStart = new Date(timeBank[0]);
    const dateFinish = new Date(timeBank[1]);
    const arrTimeWork = [];
    for (const busyTime of arrBusyTime) {
        if (isNotTime(busyTime, dateStart, dateFinish)) {
            return [];
        }
        if (firstHappenInterval(busyTime, dateStart, dateFinish)) {
            dateStart.setTime(busyTime[1].getTime());
        } else if (secondHappenInterval(busyTime, dateStart, dateFinish)) {
            arrTimeWork.push([dateStart.getTime(), busyTime[0].getTime()]);
            dateStart.setTime(busyTime[1].getTime());
        } else if (thirdHappenInterval(busyTime, dateStart, dateFinish)) {
            dateFinish.setTime(busyTime[0].getTime());
        }
    }
    arrTimeWork.push([dateStart.getTime(), dateFinish.getTime()]);

    return arrTimeWork;
}

function isNotTime(busyTime, dateStart, dateFinish) {
    return busyTime[0] <= dateStart &&
        busyTime[1] >= dateFinish;
}

function firstHappenInterval(busyTime, dateStart, dateFinish) {
    return busyTime[0] < dateStart &&
            busyTime[1] > dateStart &&
            busyTime[1] < dateFinish;
}

function secondHappenInterval(busyTime, dateStart, dateFinish) {
    return busyTime[0] > dateStart &&
            busyTime[1] < dateFinish;
}

function thirdHappenInterval(busyTime, dateStart, dateFinish) {
    return busyTime[0] > dateStart &&
            busyTime[0] < dateFinish &&
            busyTime[1] > dateFinish;
}

function filterTimeDuration(arrTime, duration) {
    const arrFilterTime = [];
    for (const timeJobDay of arrTime) {
        arrFilterTime.push(timeJobDay.filter(freeTime =>
            freeTime[1] - freeTime[0] >= duration * 60 * 1000));
    }

    return arrFilterTime;
}

function compareStartTime(firstTime, secondTime) {
    if (firstTime[0] > secondTime[0]) {
        return 1;
    }
    if (firstTime[0] < secondTime[0]) {
        return -1;
    }
}

module.exports = {
    getAppropriateMoment,

    isStar
};

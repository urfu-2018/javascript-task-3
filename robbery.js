'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const dateRegex = /([А-Я]{2})\s(\d{2}):(\d{2})\+(\d{1,2})/;
const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

function parseDateString(dateString) {
    let parcedDateString = dateString.match(dateRegex);
    let day = days.indexOf(parcedDateString[1]) + 1;
    let timezone = Number(parcedDateString[4]);
    let hours = Number(parcedDateString[2]) - timezone;
    let minutes = Number(parcedDateString[3]);
    let dateTime = new Date(2018, 10, day, hours, minutes);

    return dateTime;
}

function intersectIntervals(intervals) { // ищем пересекающиеся интервалы и пересекаем их
    intervals.sort((a, b) => a.from - b.from);
    let out = [intervals.shift()]; // добавим первый интервал в список непересекающихся
    while (intervals.length !== 0) { // пока все интервалы не прошли
        let intervalToCheck = intervals.shift();
        let intervalToIntersect;
        let isIntersect = out.some(interval => {
            intervalToIntersect = interval;
            // проверяем, пересекается ли интервал из необработанных(intervals)
            // с каким-либо уже обработанным(out)
            // и запоминаем его

            return intervalToCheck.from <= interval.to && intervalToCheck.to >= interval.from;
        });
        if (isIntersect) {
            // если пересекается-объединяем эти интервалы
            intervalToIntersect.to = intervalToIntersect.to >= intervalToCheck.to
                ? intervalToIntersect.to : intervalToCheck.to;
        } else {
            // если нет-добавляем в непересекающиеся интервалы(out)
            out.push(intervalToCheck);
        }
    }

    return out;
}

function getBankTimeTable(workingHours) {

    return days.slice(0, 3).map(function (day) {
        let dateTimeFrom = parseDateString(day + ' ' + workingHours.from);
        let dateTimeTo = parseDateString(day + ' ' + workingHours.to);

        return {
            from: dateTimeFrom,
            to: dateTimeTo
        };
    });
}

function inverseIntervals(schedule, bankTimezone) {
    let from = parseDateString('ПН 00:00+' + String(bankTimezone));
    let to = parseDateString('СР 23:59+' + String(bankTimezone));
    let inversed = [{ from, to: schedule[0].from }];
    for (let i = 0; i < schedule.length - 1; i++) {
        inversed.push({ from: schedule[i].to, to: schedule[i + 1].from });
    }
    inversed.push({ from: schedule[schedule.length - 1].to, to });

    return inversed;
}

function getRobTime(bankTimetable, schedule) {
    let robTimes = [];
    bankTimetable.forEach(function (workday) {
        schedule.forEach(function (interval) {
            if (workday.from <= interval.to && workday.to >= interval.from) {
                let robTime = {
                    from: workday.from >= interval.from ? workday.from : interval.from,
                    to: workday.to >= interval.to ? interval.to : workday.to
                };
                robTimes.push(robTime);
            }
        });
    });

    return robTimes;
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
    // console.info(schedule, duration, workingHours);
    let allIntervals = []; // список всех пропарсеных интервалов занятостей
    Object.keys(schedule)
        .forEach(name => allIntervals.push(...schedule[name]
            .map(namedSchedule => ({
                from: parseDateString(namedSchedule.from),
                to: parseDateString(namedSchedule.to)
            }))));

    let intervals = intersectIntervals(allIntervals);
    let timeTable = getBankTimeTable(workingHours);
    let bankTimezone = ('ПН ' + workingHours.from).match(dateRegex)[4];
    let inversed = inverseIntervals(intervals, bankTimezone);
    let robTimes = getRobTime(timeTable, inversed)
        .filter(time => duration <= (time.to - time.from) / 60000);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robTimes.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robTimes.length === 0) {

                return '';
            }
            let time = new Date(robTimes[0].from);
            time.setTime(time.getTime() + bankTimezone * 60 * 60 * 1000);
            let day = days[time.getDate() - 1];
            let hours = time.getHours();
            let minutes = time.getMinutes();

            if (String(hours).length === 1) {
                hours = '0' + hours;
            }
            if (String(minutes).length === 1) {
                minutes = '0' + minutes;
            }

            return template.replace('%DD', day)
                .replace('%HH', hours)
                .replace('%MM', minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robTimes.length > 1) {
                let tempTime = new Date(robTimes[0].from.getTime() + 1000 * 30 * 60);
                let diff = (robTimes[0].to - tempTime) / 60000;
                if (duration <= diff) {
                    robTimes[0].from = tempTime;

                    return true;
                }
                robTimes.shift();

                return true;
            }
            if (robTimes.length === 1) {
                return false;
            }

        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

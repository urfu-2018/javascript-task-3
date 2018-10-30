'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const robDays = ['ПН', 'ВТ', 'СР']; /* через индекс я буду получать дни недели, а через indexOf()
                                        - номера дней, для этого начал порядок с 0*/

const minutesInHour = 60;
const hoursInDay = 24;
const dayEndInMinutes = 1439; // количество минут в одном дне на момент времени 23:59


/**
 * Конвертирует полученный объект даты в количество минут (не больше 1440 (кол-во минут в дне))
 * @param {Object} date
 * @returns {Number}
 */
function convertToMinutes(date) {
    return parseInt(date.minutes) + parseInt(date.hours * minutesInHour);
}

/**
 * Создает объект даты (через встроенную Date невозможно работать с ее загонами под локальное время)
 * @param {Number} day
 * @param {Number} hours
 * @param {Number} minutes
 * @returns {Object}
 */
function createDate(day, hours, minutes) {
    if (minutes >= minutesInHour) {
        hours += Math.floor(minutes / minutesInHour);
        minutes = minutes % minutesInHour;
    }
    if (hours >= hoursInDay) {
        day += Math.floor(hours / hoursInDay);
        hours = hours % hoursInDay;
    }

    const myDate = {
        day,
        hours,
        minutes
    };

    return myDate;
}

/**
 * Превращает строку с расписанием в объект даты
 * @param {String} timeTable
 * @param {Number?} bankTimeZone
 * @param {Number?} day
 * @returns {Object}
 */
function formatSchedule(timeTable, bankTimeZone, day) {
    const hours = parseInt(timeTable.match(/\d{2}/)[0]);
    const minutes = parseInt(timeTable.match(/:\d{2}/)[0].replace(':', ''));
    let difference = 0;

    /* если была подана зона банка, значит это грабитель, и надо посчитать разницу, если нет,
    то это банк и у него разница с собой 0*/
    if (bankTimeZone) {
        const timeZone = parseInt(timeTable.match(/\+\d+/)[0].replace(/\+/, ''));
        difference = timeZone - bankTimeZone;
    }

    if (!day) {
        day = timeTable.substr(0, 2);
        day = robDays.indexOf(day);
    }

    return createDate(day, hours - difference, minutes);
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

    /* единственное, что эта строка повторяется дважды, но тут как раз идет отказ от функции
    getTimeZone и уход от лишнего парсинга*/
    const bankZone = parseInt(workingHours.from.match(/\+\d+/)[0].replace(/\+/, ''));

    let noRobTime = { // массив занятости
        0: [], // сделал начало с 0, чтобы было удобнее работать с индексами массива дней
        1: [],
        2: []
    };

    /**
     * инициализирует массив занятости началом и концом работы банка
     */
    function initializeNoRobTime() {
        const days = Object.keys(noRobTime);

        const minutesOfStartWork = convertToMinutes(formatSchedule(workingHours.from));
        const minutesOfStopWork = convertToMinutes(formatSchedule(workingHours.to));

        days.forEach(day => {
            noRobTime[day].push(
                {
                    fromInMinutes: 0,
                    toInMinutes: minutesOfStartWork
                },
                {
                    fromInMinutes: minutesOfStopWork,
                    toInMinutes: dayEndInMinutes
                });
        });
    }

    /**
     * добавляет расписание занятости грабителя в массив занятости
     * @param {Object[]} robber
     */
    function addNewRobTime(robber) {
        if (schedule[robber].length > 0) {
            const robberBusyness = schedule[robber];

            robberBusyness.forEach(gap => {
                const busyFrom = formatSchedule(gap.from, bankZone);
                const busyTo = formatSchedule(gap.to, bankZone);

                updateRobTime(busyFrom, busyTo);
            });
        }
    }

    /**
     * добавляет интервал занятости в массив занятости
     * @param {Number} from
     * @param {Number} to
     */
    function updateRobTime(from, to) {
        const dayFrom = from.day;
        const dayTo = to.day;
        const pushTo = convertToMinutes(to);
        const pushFrom = convertToMinutes(from);

        const differenceInDays = dayTo - dayFrom;

        if (differenceInDays === 0) { // если в 1 день занят, то и добавлять в 1 ключ (ключ = день)
            noRobTime[dayFrom].push({ fromInMinutes: pushFrom, toInMinutes: pushTo });
        } else { // если в разные дни, то надо в разные ключи
            noRobTime[dayFrom].push({ fromInMinutes: pushFrom, toInMinutes: dayEndInMinutes });
            noRobTime[dayTo].push({ fromInMinutes: 0, toInMinutes: pushTo });
        } /* если разность в днях больше 1, то все, что между ними надо заполнить всем днем
            (да, в данной ситуации это только вторник, но я решил сделать общий случай)*/
        for (let i = dayFrom + 1; i < dayTo; i++) {
            noRobTime[i].push({ fromInMinutes: 0, toInMinutes: dayEndInMinutes });
        }
    }

    /**
     * Высчитывает все возможные интервалы, когда можно грабить
     * @returns {Object[]}
     */
    function searchRobTime() {
        let result = [];

        initializeNoRobTime();

        const robbers = Object.keys(schedule);
        const daysToRob = Object.keys(noRobTime);

        robbers.forEach(robber => addNewRobTime(robber));
        daysToRob.forEach(day => {

            noRobTime[day] = noRobTime[day].sort((gap1, gap2) =>
                gap1.fromInMinutes - gap2.fromInMinutes);
            // сортировка по началу, чтобы удобнее было смотреть свободные промежутки
            for (let i = 0; i < noRobTime[day].length - 1; i++) {

                const startBusyCurrentGap = parseInt(noRobTime[day][i].fromInMinutes);
                const endBusyCurrentGap = parseInt(noRobTime[day][i].toInMinutes);
                const startBusyNextGap = parseInt(noRobTime[day][i + 1].fromInMinutes);
                const endBusyNextGap = parseInt(noRobTime[day][i + 1].toInMinutes);

                let freeTime = startBusyNextGap - endBusyCurrentGap;
                let tryLaterTimes = 0;

                while (freeTime >= duration) {
                    result.push(createDate(day, 0, endBusyCurrentGap + tryLaterTimes * 30));
                    freeTime -= 30;
                    tryLaterTimes++;
                }
                if (startBusyCurrentGap <= startBusyNextGap &&
                    endBusyCurrentGap >= endBusyNextGap) {

                    noRobTime[day][i + 1] = noRobTime[day][i];

                    /* в этом случае предшествующий полностью покрывает следующего, для
                    корректности его надо присвоить следующему */
                }
            }
        });

        return result;
    }

    let timeToRob = searchRobTime(); // массив всех свободных интервалов

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return (timeToRob.length > 0);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (timeToRob.length === 0) {
                return '';
            }

            const day = robDays[timeToRob[0].day];
            let hours = timeToRob[0].hours;
            let minutes = timeToRob[0].minutes;

            /**
             * переводит время в кооректный формат вывода
             * @param {Number} time
             * @returns {String}
             */
            function formatOutputTime(time) {
                return (time < 10) ? `0${time}` : time.toString();
            }

            hours = formatOutputTime(hours);
            minutes = formatOutputTime(minutes);

            return template
                .replace(/%DD/, day)
                .replace(/%HH/, hours)
                .replace(/%MM/, minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {

            if (timeToRob.length > 1) {
                timeToRob.splice(0, 1);

                return true;
            }

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

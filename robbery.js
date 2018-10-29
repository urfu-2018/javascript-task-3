'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const swapNumberAndStringDays = {
    'ПН': 1, 'ВТ': 2, 'СР': 3,
    1: 'ПН', 2: 'ВТ', 3: 'СР'
};

const minutesInHour = 60;
const hoursInDay = 24;
const dayEndInMinutes = 1440 - 1;


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
 * @param {Number} bankTimeZone
 * @param {Number} robberTimeZone
 * @param {Number?} day
 * @returns {Object}
 */
function formatSchedule(timeTable, bankTimeZone, robberTimeZone, day) {
    const hours = parseInt(timeTable.match(/\d{2}/)[0]);
    const minutes = parseInt(timeTable.match(/:\d{2}/)[0].replace(':', ''));
    const difference = robberTimeZone - bankTimeZone;

    if (!day) {
        day = timeTable.substr(0, 2);
        day = swapNumberAndStringDays[day];
    }

    return createDate(day, hours - difference, minutes);
}

/**
 * Парсит расписание и возвращает его часовой пояс
 * @param {String} time
 * @returns {Number}
 */
function getTimeZone(time) {
    return parseInt(time.match(/\+\d+/)[0].replace(/\+/, ''));
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
    console.info(schedule, duration, workingHours);
    let noRobTime = { // массив занятости
        1: [],
        2: [],
        3: []
    };

    const bankZone = getTimeZone(workingHours.from);

    /**
     * инициализирует массив занятости началом и концом работы банка
     */
    function initializeNoRobTime() {
        const days = Object.keys(noRobTime);

        days.forEach(day => {
            noRobTime[day].push(
                {
                    fromInMinutes: 0,
                    toInMinutes: convertToMinutes(formatSchedule(workingHours.from, 0, 0, day))
                },
                {
                    fromInMinutes: convertToMinutes(formatSchedule(workingHours.to, 0, 0, day)),
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
            const robberZone = getTimeZone(schedule[robber][0].from);
            const robberBusyness = schedule[robber];

            robberBusyness.forEach(gap => {
                const busyFrom = formatSchedule(gap.from, bankZone, robberZone);
                const busyTo = formatSchedule(gap.to, bankZone, robberZone);

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

            const day = swapNumberAndStringDays[parseInt(timeToRob[0].day)];
            let hours = timeToRob[0].hours;
            let minutes = timeToRob[0].minutes;

            if (minutes < 10) {
                minutes = `0${minutes}`;
            }
            if (hours < 10) {
                hours = `0${hours}`;
            }

            return template.replace(/%DD/, day)
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

'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
const dayOfWeek = new Map();
dayOfWeek.set('ПН', 0);
dayOfWeek.set('ВТ', 1);
dayOfWeek.set('СР', 2);
dayOfWeek.set('ЧТ', 3);
const backToDay = ['ПН', 'ВТ', 'СР'];
let timezone = 0;
let bankTimeFrom;
let bankTimeTo;
let _duration;


class Time {
    constructor(minutes, day) {
        this.minutes = minutes;
        this.day = day;
    }

    getMinutes() {
        return this.minutes;
    }

    getTimeFromMinutes() {
        let hours = Math.floor(this.minutes / 60) + timezone;
        let minutes = this.minutes - 60 * Math.floor(this.minutes / 60);
        if (hours < 0) {
            return {
                day: backToDay[this.day - 1],
                hours: 24 + hours,
                minutes
            };
        } else if (hours >= 24) {
            return {
                day: backToDay[this.day + 1],
                hours: 24 - hours,
                minutes
            };
        }

        return {
            day: backToDay[this.day],
            hours,
            minutes
        };

    }
}

class Section {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }

    isIntersection(section) {
        return section.to.getMinutes() >= this.from.getMinutes() &&
            section.from.getMinutes() <= this.to.getMinutes();
    }
}

function addToInSections(sections, to) {
    sections[to.day].push(new Section(new Time(0, to.day), to));
}

function addFromInSections(sections, from) {
    sections[from.day].push(new Section(from, new Time(1439, from.day)));
}

function addInSections(sections, from, to) {
    if (from && !to) {
        addFromInSections(sections, from);
    } else if (to && !from) {
        addToInSections(sections, to);
    }
}

function makeSectionsFromSchedule(_schedule, sections) {
    for (let i of _schedule) {
        let from = parseTime(i.from);
        let to = parseTime(i.to);
        if (!from || !to) {
            addInSections(sections, from, to);
            continue;
        }
        if (from.day !== to.day) {
            addFromInSections(sections, from);
            addToInSections(sections, to);
        } else {
            sections[from.day].push(new Section(from, to));
        }
    }
}

function findTime(sections) {
    let result = null;
    sections = sections.map(x=> x.sort((a, b) => {
        return a.from.getMinutes() - b.from.getMinutes();
    }));

    for (let i = 0; i < 3; i++) {
        let intersections = [];
        let section = sections[i];
        findIntersection(section, intersections);
        intersections = intersections.filter(x => x.length !== 0);
        if (intersections.length === 1) {
            result = findWithOneIntersection(intersections, i);
        } else if (intersections.length === 0) {
            result = findWithoutIntersection(sections[i], i);
        } else {
            result = findWithSomeIntersections(intersections, i);
        }
        if (result) {
            return result;
        }
    }

    return result;
}

function findIntersection(section, intersections) {
    for (let j of section) {
        let intersection = new Set();
        section.forEach(x => {
            if (x === j || j.isIntersection(x)) {
                intersection.add(x);
            }
        });
        intersections.push(Array.from(intersection.values()));
    }
}

function findWithOneIntersection(intersections, day) {
    let result = null;
    let min = intersections[0][0].from.getMinutes();
    let max = intersections[0][intersections.length - 1].to.getMinutes();
    if (min - bankTimeFrom >= _duration) {
        return new Time(bankTimeFrom, day);
    }
    if (bankTimeTo - max >= _duration) {
        return new Time(max, day);
    }

    return result;
}

function findWithSomeIntersections(intersections, day) {
    let _sections = [];
    for (let n of intersections) {
        let _from = n[0].from.getMinutes();
        let _to = n[n.length - 1].to.getMinutes();
        _sections.push(new Section(_from, _to));
    }

    return findWithoutIntersection(_sections, day);
}

function checkLastSection(section, result, day) {
    if (bankTimeTo - section[section.length - 1].to >= _duration) {
        result = new Time(section[section.length - 1], day);
    }

    return result;
}

function findWithoutIntersection(section, day) {
    let result = null;
    let start = bankTimeFrom;
    for (let m of section) {
        if (m.from < start && m.to <= start) {
            continue;
        }
        if (m.from - start >= _duration && m.from < bankTimeTo) {
            return new Time(start, day);
        }
        start = m.to;
    }
    result = checkLastSection(section, result, day);

    return result;
}

function hoursToMinutes(hours, minutes) {
    return hours * 60 + minutes;
}

function parseWorkingHours(str) {
    timezone = parseInt(str.substr(6, 2));
    let hours = parseInt(str.substr(0, 2)) - timezone;
    let _hours = hours < 0 ? hours + 24 : hours;
    let minutes = parseInt(str.substr(3, 2));

    return new Time(hoursToMinutes(_hours, minutes), 'all');
}

function parseTime(str) {
    let hours = parseInt(str.substr(3, 2)) - parseInt(str.substr(9, 2));
    let minutes = parseInt(str.substr(6, 2));
    let day = dayOfWeek.has(str.substr(0, 2)) ? dayOfWeek.get(str.substr(0, 2)) : 3;
    if (hours < 0) {
        if (day - 1 >= 0 && day - 1 < 3) {
            day -= 1;
            hours += 24;
        } else {
            hours = 0;
        }
    }

    return day !== 3 ? new Time(hoursToMinutes(hours, minutes), day) : null;
}

function formatTime(template, time) {
    let minutes = time.minutes < 10 ? '0' + time.minutes : time.minutes;
    let _template = template.replace(/%HH:%MM/,
        `${time.hours}:${minutes}`);
    _template = _template.replace(/%DD/,
        time.day);

    return _template;
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
    _duration = duration;
    bankTimeFrom = parseWorkingHours(workingHours.from).getMinutes();
    bankTimeTo = parseWorkingHours(workingHours.to).getMinutes();
    console.info(schedule, duration, workingHours);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return this.format('%DD %HH:%MM') !== '';
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let _schedule = [];
            Object
                .keys(schedule)
                .map(x => schedule[x])
                .forEach(x => x.forEach(y => _schedule.push(y)));
            let sections = [];
            for (let i = 0; i < 3; i++) {
                sections[i] = [];
            }
            makeSectionsFromSchedule(_schedule, sections);
            let result = findTime(sections);

            return result ? formatTime(template, result.getTimeFromMinutes()) : '';
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
}

module.exports = {
    getAppropriateMoment,

    isStar
};

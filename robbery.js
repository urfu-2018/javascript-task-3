'use strict';

const isStar = true;
const DAY_DURATION = 1440;


function translateTimeBank(time) {
    const hour = Number(time.slice(0, 2));
    const minute = Number(time.slice(3, 5));

    return hour * 60 + minute;
}

function translateTimeGuy(time) {
    const day = time.slice(0, 2);
    const hour = Number(time.slice(3, 5));
    const minute = Number(time.slice(6, 8));
    switch (day) {
        case 'ПН':
            return hour * 60 + minute;
        case 'ВТ':
            return DAY_DURATION + hour * 60 + minute;
        case 'СР':
            return DAY_DURATION * 2 + hour * 60 + minute;
        case 'ЧТ':
            return DAY_DURATION * 3 + hour * 60 + minute;
        default:
            return 5760;
    }
}

function intersectTime(listTime, start, end, sliceTime) {
    const [startSlice, endSlice] = sliceTime;
    if (end < endSlice) {
        if (startSlice < start) {
            listTime.push([startSlice, start], [end, endSlice]);
        } else if (startSlice < end) {
            listTime.push([end, endSlice]);
        } else {
            listTime.push(sliceTime);
        }
    } else if (startSlice < start) {
        if (start < endSlice) {
            listTime.push([startSlice, start]);
        } else {
            listTime.push(sliceTime);
        }
    }

    return listTime;
}

function refinementTime(start, end, timeRobbery) {
    let listTime = [];
    for (const sliceTime of timeRobbery) {
        listTime = intersectTime(listTime, start, end, sliceTime);
    }

    return listTime;
}

function convertTime(time) {
    let minute = time % 60;
    let hour = (time % DAY_DURATION - minute) / 60;
    if (minute < 10) {
        minute = '0' + minute;
    }
    if (hour < 10) {
        hour = '0' + hour;
    }
    if (time < DAY_DURATION) {
        return [hour, minute, 'ПН'];
    }
    if (time < DAY_DURATION * 2) {
        return [hour, minute, 'ВТ'];
    }

    return [hour, minute, 'СР'];
}

function getAppropriateMoment(schedule, duration, workingHours) {
    const openBank = translateTimeBank(workingHours.from);
    const closeBank = translateTimeBank(workingHours.to);
    const timezoneBank = Number(workingHours.from.slice(6, 8));
    let timeRobbery = [
        [openBank, closeBank],
        [DAY_DURATION + openBank, DAY_DURATION + closeBank],
        [DAY_DURATION * 2 + openBank, DAY_DURATION * 2 + closeBank]
    ];
    for (const guy of Object.keys(schedule)) {
        for (const workingGuy of schedule[guy]) {
            const timezoneGuy = Number(workingGuy.from.slice(9, 11));
            const startGuy = translateTimeGuy(workingGuy.from) + 60 * (timezoneBank - timezoneGuy);
            const endGuy = translateTimeGuy(workingGuy.to) + 60 * (timezoneBank - timezoneGuy);
            timeRobbery = refinementTime(startGuy, endGuy, timeRobbery);
        }
    }
    timeRobbery = timeRobbery.filter(entry => entry[1] - entry[0] >= duration);

    return {
        exists: function () {
            return timeRobbery.length !== 0;
        },
        format: function (template) {
            if (timeRobbery.length !== 0) {
                const robbery = convertTime(timeRobbery[0][0]);

                return template.replace('%HH', robbery[0])
                    .replace('%MM', robbery[1])
                    .replace('%DD', robbery[2]);
            }

            return '';
        },
        tryLater: function () {
            if (timeRobbery.length === 0) {
                return false;
            }
            const fistSlice = timeRobbery[0];
            if (fistSlice[1] - fistSlice[0] >= duration + 30) {
                timeRobbery[0][0] += 30;

                return true;
            }
            timeRobbery.splice(0, 1);
            if (timeRobbery.length > 0) {
                return true;
            }
            timeRobbery.push(fistSlice);

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

function getWeekDay(date, dif) {
  let days = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];
  let changeTime = (days.indexOf(date) + dif) % 7;
  if (days.indexOf(date) + dif >= 0) {
    changeTime = (days.indexOf(date) + dif) % 7;
  } else {
    changeTime = 7 + days.indexOf(date) + dif;
  }
  return days[changeTime];
}

function changeTime(day, dif) {
  for (const duration in day) {
    let time = day[duration];
    let dayOfWeek = time.slice(0, 2);
    let hour = Number(time.slice(3, 5));
    let strHour = "";
    let minute = time.slice(6, 8);
    let lasts = Number(time.slice(9, 10)) + dif;
    let newHour = hour + dif;
    if (newHour >= 24) {
      dayOfWeek = getWeekDay(dayOfWeek, +1);
      newHour = newHour - 24;
    }
    if (newHour < 0) {
      dayOfWeek = getWeekDay(dayOfWeek, -1);
      newHour = 24 + newHour;
    }
    if (newHour < 10) {
      strHour = "0" + newHour.toString();
    } else {
      strHour = newHour.toString();
    }
    day[duration] = `${dayOfWeek} ${strHour}:${minute}+${lasts}`;
  }
}

function normalizeTime(day, duration) {
  let time = day[duration];
  let from = {
    day: time.slice(0, 2),
    hour: Number(time.slice(3, 5)),
    minute: Number(time.slice(6, 8)),
  };
  return from;
}

function normalizeBankTime(day, duration, strWorkingHours) {
  let time = strWorkingHours[duration];
  let from = {
    hour: Number(time.slice(0, 2)),
    minute: Number(time.slice(3, 5)),
  };
  day[duration] = from;
}

function translateTime(schedule, strSchedule, strWorkingHours) {
  let a = 0;
  let dif = Number(strWorkingHours.from.split("+")[1]);
  for (const name in strSchedule) {
    schedule[name] = [];
    let workDif = Number(strSchedule[name][0].from.split("+")[1]);
    if (workDif !== dif) {
      for (let day of strSchedule[name]) {
        changeTime(day, -(workDif - dif));
      }
    }
    for (let day of strSchedule[name]) {
      schedule[name].push({from:normalizeTime(day, "from"),to:normalizeTime(day, "to")});
    }
  }
}

function addTime(arr, duration, workingHours, direct, opposite, man, dif, day) {
  if (
    (!(
      duration[direct].hour * dif <= workingHours[direct].hour * dif ||
      (duration[direct].hour * dif === workingHours[direct].hour * dif &&
        duration[direct].minute * dif <= workingHours[direct].minute * dif)
    ) &&
      duration[direct].hour * dif <= workingHours[opposite].hour * dif) ||
    (duration[direct].hour * dif === workingHours[opposite].hour * dif &&
      duration[direct].minute * dif <= workingHours[opposite].minute * dif)
  ) {
    arr.push([duration[direct].hour, duration[direct].minute, man, day]);
  }
}

function prepareArrs(day, schedule, froms, toes, workingHours, days, sorting) {
  for (let man in schedule) {
    let min_time = [23, 59];
    let max_time = [0, 0];
    for (let time of schedule[man]) {
      if (time.from.day !== day) {
        if (
          (day === "ПН" && time.from.day === "ВС") ||
          days[days.indexOf(time.from.day) + 1] === day
        ) {
          if (time.to.day === day) {
            if (
              sorting(
                [workingHours.from.hour, workingHours.from.minute],
                [time.to.hour, time.to.minute]
              ) < 0
            ) {
              min_time = [workingHours.from.hour, workingHours.from.minute];
            }
            addTime(
              toes,
              {
                from: { hour: 0, minute: 0 },
                to: { hour: time.to.hour, minute: time.to.minute },
              },
              workingHours,
              "from",
              "to",
              man,
              +1,
              day
            );
          }
        }
      } else {
        if (time.from.day === day) {
          let newTime = {
            from: {
              hour: time.from.hour,
              minute: time.from.minute,
              day: time.from.day,
            },
            to: {
              hour: time.to.hour,
              minute: time.to.minute,
              day: time.to.day,
            },
          };
          if (newTime.to.day !== day) {
            newTime.to.hour = 23;
            newTime.to.minute = 59;
            newTime.to.day = day;
          }
          if (sorting(min_time, [newTime.from.hour, newTime.from.minute]) > 0) {
            min_time = [newTime.from.hour, newTime.from.minute];
          }
          addTime(toes, newTime, workingHours, "from", "to", man, +1, day);
        }
      }
      if (time.to.day !== day) {
        if (
          (day === "СР" && time.to.day === "ЧТ") ||
          days[days.indexOf(time.to.day) - 1] === day
        ) {
          if (time.from.day === day) {
            if (
              sorting(
                [workingHours.to.hour, workingHours.to.minute],
                [time.from.hour, time.from.minute]
              ) > 0
            ) {
              max_time = [workingHours.to.hour, workingHours.to.minute];
            }
            addTime(
              froms,
              time,
              {
                to: { hour: 23, minute: 59 },
                from: { hour: time.from.hour, minute: time.from.minute },
              },
              "to",
              "from",
              man,
              -1,
              day
            );
          }
        }
      } else {
        if (time.to.day == day) {
          let newTime = {
            from: {
              hour: time.from.hour,
              minute: time.from.minute,
              day: time.from.day,
            },
            to: {
              hour: time.to.hour,
              minute: time.to.minute,
              day: time.to.day,
            },
          };
          if (newTime.from.day !== day) {
            newTime.from.hour = 0;
            newTime.from.minute = 0;
            newTime.from.day = day;
          }
          if (sorting(max_time, [newTime.to.hour, newTime.to.minute]) < 0) {
            max_time = [newTime.to.hour, newTime.to.minute];
          }
          addTime(froms, newTime, workingHours, "to", "from", man, -1, day);
        }
      }
    }
    if (
      sorting(min_time, [workingHours.from.hour, workingHours.from.minute]) > 0
    ) {
      froms.push([workingHours.from.hour, workingHours.from.minute, man, day]);
    }
    if (sorting(max_time, [workingHours.to.hour, workingHours.to.minute]) < 0) {
      toes.push([workingHours.to.hour, workingHours.to.minute, man, day]);
    }
  }
}

function getAnswer(froms, toes, duration, sorting, answer) {
  let times = new Set();
  for (let i = 0; i < froms.length; i++) {
    let begin = froms[i];
    let names = new Set();
    names.add(begin[2]);
    let end;
    for (let l = 0; l < toes.length; l++) {
      end = toes[l];
      if (sorting(begin, end) > 0) {
        continue;
      }
      for (let j = 0; j < froms.length; j++) {
        let hook = froms[j];
        if (sorting(hook, begin) < 0) {
          continue;
        }
        if (sorting(end, hook) < 0) {
          break;
        }
        if (!names.has(hook[2])) {
          let n_end;
          for (let k = 0; k < toes.length; k++) {
            n_end = toes[j];
            if (hook[2] === n_end[2] && sorting(hook, n_end) <= 0) {
              break;
            }
          }
          if (sorting(n_end, end) >= 0) {
            names.add(hook[2]);
          }
          if (names.size === 3) {
            let ans_time = [hook[0], hook[1], hook[3]];
            while (
              (end[0] - ans_time[0]) * 60 + end[1] - ans_time[1] >=
              duration
            ) {
              let ans = ans_time[0] + ":" + ans_time[1];
              if (!times.has(ans)) {
                answer.push([ans_time[0], ans_time[1], ans_time[2]]);
                times.add(ans);
              }
              ans_time[1] += 30;
              if (ans_time[1] >= 60) {
                ans_time[0] += 1;
                ans_time[1] = ans_time[1] % 60;
              }
            }
            break;
          }
        }
      }
    }
  }
}
/**
 * @param {Object} schedule Расписание Банды
 * @param {number} duration Время на ограбление в минутах
 * @param {Object} workingHours Время работы банка
 * @param {string} workingHours.from Время открытия, например, "10:00+5"
 * @param {string} workingHours.to Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(strSchedule, duration, strWorkingHours) {
  let workingHours = {};
  let schedule = {};
  translateTime(schedule, strSchedule,strWorkingHours);
  normalizeBankTime(workingHours, "from", strWorkingHours);
  normalizeBankTime(workingHours, "to", strWorkingHours);
  let durations = [];
  let days = ["ПН", "ВТ", "СР"];
  let sorting = function (a, b) {
    let hour1 = a[0];
    let hour2 = b[0];
    let minute1 = a[1];
    let minute2 = b[1];
    return hour1 < hour2
      ? -1
      : hour1 > hour2
      ? 1
      : minute1 < minute2
      ? -1
      : minute1 > minute2
      ? 1
      : 0;
  };
  for (let day of days) {
    let froms = [];
    let toes = [];
    prepareArrs(day, schedule, froms, toes, workingHours, days, sorting);
    froms.sort(sorting);
    toes.sort(sorting);
    let a = 0;
    getAnswer(froms, toes, duration, sorting, durations);
    a = 0;
  }

  return {
    answer: durations,
    last_index: 0,
    /**
     * Найдено ли время
     * @returns {boolean}
     */
    exists() {
      return this.answer.length > 0;
    },

    /**
     * Возвращает отформатированную строку с часами
     * для ограбления во временной зоне банка
     *
     * @param {string} template
     * @returns {string}
     *
     * @example
     * ```js
     * getAppropriateMoment(...).format('Начинаем в %HH:%MM (%DD)') // => Начинаем в 14:59 (СР)
     * ```
     */
    format(template) {
      if (this.exists()) {
        let strHour;
        let strMinute;
        if (this.answer[this.last_index][0] < 10) {
          strHour = "0" + this.answer[this.last_index][0].toString();
        } else {
          strHour = this.answer[this.last_index][0].toString();
        }
        if (this.answer[this.last_index][1] < 10) {
          strMinute = "0" + this.answer[this.last_index][1].toString();
        } else {
          strMinute = this.answer[this.last_index][1].toString();
        }
        let res = template
          .replace("%HH", strHour)
          .replace("%MM", strMinute)
          .replace("%DD", this.answer[this.last_index][2]);
        return res;
      } else {
        return "";
      }
    },

    /**
     * Попробовать найти часы для ограбления позже [*]
     * @note Не забудь при реализации выставить флаг `isExtraTaskSolved`
     * @returns {boolean}
     */
    tryLater() {
      if (this.last_index < this.answer.length - 1) {
        this.last_index++;
        return true;
      }
      return false;
    },
  };
}

module.exports = {
    getAppropriateMoment,

    isStar
};

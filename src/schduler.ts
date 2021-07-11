export enum Meal {
  BREAKFAST = "BREAKFAST",
  LUNCH = "LUNCH",
  HAPPYHOUR = "HAPPYHOUR",
  DINNER = "DINNER",
}

interface mealChore {
  day: number;
  type: Meal;
}

interface shipDay {
  date: Date;
  day: number;
  isLastDay: boolean;
}

const createDates = (days: number, start: Date): shipDay[] => {
  let list: shipDay[] = [];
  for (let i = 0; i < days; i++) {
    let d = new Date(start);
    d.setDate(start.getDate() + i);

    list.push({ date: d, day: i, isLastDay: i === days - 1 });
  }
  console.log("days", list);
  return list;
};

const getDailyChores = (day: number): mealChore[] => {
  return [
    { day, type: Meal.BREAKFAST },
    { day, type: Meal.LUNCH },
    { day, type: Meal.HAPPYHOUR },
    { day, type: Meal.DINNER },
  ];
};

export interface Assignment {
  day: number;
  date: Date;
  type: Meal;
  workers: string[];
}

const makePaddingRow = (length: number): string[] => {
  let a: string[] = [];
  for (let i = 0; i < length; i++) {
    a.push("");
  }
  return a;
};

export const toShortDate = (date: Date): string =>
  `${date.getMonth() + 1}/${date.getDate()}`;

export const makeChoreChart = (assignments: Assignment[]) => {
  let csv: string = "";
  const writeCSV = (list: string[]) => {
    csv += list.join(",") + "\n";
  };
  const writeType = (type: Meal) => {
    const rowdata = assignments
      .filter((a) => a.type === type)
      .sort((a, b) => a.day - b.day)
      .map((a) => a.workers);
    // console.debug(type, rowdata);
    // write first person for breakfast
    writeCSV([type.toString()].concat(rowdata.map((a) => a[0])));
    if (type !== Meal.HAPPYHOUR) {
      // write second person for breakfast
      writeCSV([type.toString()].concat(rowdata.map((a) => a[1])));
    }
    writeCSV(makePaddingRow(rowdata.length));
  };

  const header = ["Dates"].concat(
    assignments
      .filter((a) => a.type === Meal.HAPPYHOUR)
      .sort((a, b) => a.day - b.day)
      .map((a) => toShortDate(a.date))
  );

  writeCSV(header);
  writeType(Meal.BREAKFAST);
  writeType(Meal.LUNCH);
  writeType(Meal.HAPPYHOUR);
  writeType(Meal.DINNER);

  return csv;
};

export const assignAllChores = (
  dayCount: number,
  startDate: Date,
  sailors: string[]
): Assignment[] => {
  const dates = createDates(dayCount, startDate);

  const chores: Assignment[] = [];
  const getAssignedSailorForChore = (
    sortedSailors: string[],
    currentDay: number,
    choreType: Meal,
    coWorker?: string
  ) => {
    const assignee = sortedSailors.find((sailor) => {
      if (sailor === coWorker) {
        return false;
      }
      const didAnyChoresToday = chores.some(
        (chore) => chore.day === currentDay && chore.workers.includes(sailor)
      );
      const didThisChoreYesterday =
        currentDay === 0
          ? false
          : chores.some(
              (chore) =>
                chore.day === currentDay - 1 &&
                chore.workers.includes(sailor) &&
                chore.type === choreType
            );
      return !didThisChoreYesterday && !didAnyChoresToday;
    });
    if (!assignee) {
      console.debug("no eligable sailor!", choreType);
      throw new Error("no eligable sailor!" + choreType);
    }
    return assignee;
  };

  const assigned = new Set<string>();
  const workCounts = new Map<string, number>();
  const incrChoreCount = (sailor: string, chore: Meal) =>
    workCounts.set(
      `${sailor}:${chore}`,
      (workCounts.get(`${sailor}:${chore}`) ?? 0) + 1
    );

  const sortSailorsByChore = (sailors: string[], chore: Meal) =>
    [...sailors].sort((a, b) => {
      const aTimes = workCounts.get(`${a}:${chore}`) ?? 0;
      const bTimes = workCounts.get(`${b}:${chore}`) ?? 0;
      return aTimes - bTimes;
    });

  let firstRound = true;
  for (let i = 0; i < dates.length; i++) {
    const sday = dates[i];
    const currentDay = sday.day;

    const meals = getDailyChores(currentDay);
    for (let j = 0; j < meals.length; j++) {
      const choreType = meals[j].type;

      const sortedSailors = firstRound
        ? sailors
        : sortSailorsByChore(sailors, choreType);

      const firstWorker = getAssignedSailorForChore(
        sortedSailors,
        currentDay,
        choreType
      );

      const workers =
        choreType !== Meal.HAPPYHOUR
          ? [
              firstWorker,
              getAssignedSailorForChore(
                sortedSailors,
                currentDay,
                choreType,
                firstWorker
              ),
            ]
          : [firstWorker];

      chores.push({
        workers,
        date: sday.date,
        day: sday.day,
        type: choreType,
      });
      workers.forEach((w) => {
        incrChoreCount(w, choreType);
        assigned.add(w);
      });
      if (firstRound && assigned.size >= sailors.length) {
        firstRound = false;
      } else if (firstRound) {
        sailors.push(sailors.shift() as string);
      }
    }
  }
  return chores;
};

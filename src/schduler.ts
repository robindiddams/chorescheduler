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

export class Sailor {
  name: string;
  capitan: boolean = false;
  breakfast: number = 0;
  dinner: number = 0;
  lunch: number = 0;
  happyhour: number = 0;
  chores: mealChore[] = [];

  constructor(name?: string) {
    this.name = name ?? "";
  }

  setCapitan(to: boolean) {
    this.capitan = to;
  }

  // willTakeChore ensures that a sailor has no more than 1 chore a day, and that they dont do the same chore twice in a row.
  willTakeChore(chore: mealChore): boolean {
    let didThisChoreYesterday: boolean = false;
    // check if i did the chore yesterday
    if (chore.day !== 0) {
      // dont check yesterday on the first day
      const yesterday = chore.day - 1;
      didThisChoreYesterday = !!this.chores.find(
        (pastChore) =>
          pastChore.type === chore.type && pastChore.day === yesterday
      );
      if (didThisChoreYesterday) {
        console.debug(
          `${this.name} did ${chore.type} yesterday (day: ${yesterday})`
        );
      }
    }
    const didAnyChoresToday = !!this.chores.find(
      (pastChore) => pastChore.day === chore.day
    );
    return !didThisChoreYesterday && !didAnyChoresToday;
  }

  takeChore(chore: mealChore) {
    switch (chore.type) {
      case Meal.BREAKFAST:
        this.breakfast++;
        break;
      case Meal.LUNCH:
        this.lunch++;
        break;
      case Meal.HAPPYHOUR:
        this.happyhour++;
        break;
      case Meal.DINNER:
        this.dinner++;
        break;
    }
    this.chores.push(chore);
  }
}

interface shipDay {
  date: Date;
  day: number;
}

const createDates = (days: number, start: Date): shipDay[] => {
  let list: number[] = [];
  for (let i = 0; i < days; i++) {
    list.push(i);
  }
  let daylist = list.map((delta) => {
    let d = new Date(start);
    d.setDate(start.getDate() + delta);
    return { date: d, day: delta };
  });
  console.log("days", daylist);
  return daylist;
};

const assignChore = (
  sailors: Sailor[],
  index: number,
  chore: mealChore
): number => {
  const incr = () => {
    if (index < sailors.length - 1) {
      index++;
    } else {
      index = 0;
    }
  };
  for (let i = 0; i < sailors.length; i++) {
    if (sailors[index].willTakeChore(chore)) {
      console.debug(
        `${sailors[index].name} will take ${chore.type} for day ${chore.day}`
      );
      sailors[index].takeChore(chore);
      incr();
      return index;
    }
    incr();
  }
  console.debug("no eligable sailor!", chore);
  throw new Error("no eligable sailor!" + chore);
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
  const _sailors = sailors.map((s) => new Sailor(s));
  const dates = createDates(dayCount, startDate);
  let sailorIndex = 0; // keep track of where we are as we read through the sailors
  const chores = dates
    .map((shipDay) =>
      getDailyChores(shipDay.day).map(
        (chore): Assignment => {
          let workers: string[] = [];
          sailorIndex = assignChore(_sailors, sailorIndex, chore);
          workers.push(_sailors[sailorIndex].name);
          if (chore.type !== Meal.HAPPYHOUR) {
            sailorIndex = assignChore(_sailors, sailorIndex, chore);
            workers.push(_sailors[sailorIndex].name);
          }
          return {
            day: shipDay.day,
            date: shipDay.date,
            type: chore.type,
            workers,
          };
        }
      )
    )
    .reduce((acc, choreDay) => acc.concat(choreDay), [] as Assignment[]);
  return chores;
};
